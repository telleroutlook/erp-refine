// src/routes/procurement.ts
// Procurement REST API — POs (atomic), PRs, RFQs, Supplier Quotations

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { userRateLimitMiddleware } from '../middleware/rate-limit';
import { buildCrudRoutes, type CrudConfig, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, resolveEmployeeId, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';
import { findFlow } from '../utils/document-flow';
import { fetchSourceWithOpenQuantities, buildPrefilledData, createDocumentRelation } from '../utils/create-from-helpers';

const procurement = new Hono<{ Bindings: Env }>();
procurement.use('*', authMiddleware());
procurement.use('*', userRateLimitMiddleware());
procurement.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Purchase Orders — custom CRUD with atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/purchase-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'purchase_order_items' };

  const baseSelect = 'id, order_number, status, order_date, total_amount, currency, supplier:suppliers(id,name)';
  let query = db
    .from('purchase_orders')
    .select(buildSelectWithItemFilter(baseSelect, itemJoin, itemFilters), { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  query = applyItemFilters(query, itemJoin, itemFilters);
  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list PurchaseOrders. Check sort field '${sortField}' exists.`);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
procurement.get('/purchase-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,code,contact_email,contact_phone), items:purchase_order_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('PurchaseOrder', id, requestId);
  return c.json({ data });
});

// GET create-from: PR → PO (参考采购申请创建采购订单)
procurement.get('/purchase-orders/create-from/purchase-requisition/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('purchase_requisition', 'purchase_order')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully fulfilled', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// POST create (atomic: header + items)
procurement.post('/purchase-orders', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate order_number via RPC
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'purchase_order',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate PO number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, _sourceRef, ...headerFields } = body;
  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'purchase_orders',
      itemsTable: 'purchase_order_items',
      headerFk: 'purchase_order_id',
      headerReturnSelect: 'id, order_number, status',
      itemsReturnSelect: 'id, product_id, quantity, unit_price',
      autoLineNumber: true,
    },
    {
      header: {
        ...headerFields,
        order_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: empId,
      },
      items: items ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_purchase_order',
      resource: 'purchase_orders',
    }
  );

  if (_sourceRef?.type && _sourceRef?.id) {
    await createDocumentRelation(db, user.organizationId, _sourceRef.type, _sourceRef.id, 'purchase_order', result.header.id as string, `${_sourceRef.type} → purchase_order`);
  }

  return c.json({ data: result.header }, 201);
});

// PUT update
procurement.put('/purchase-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'purchase_orders',
      itemsTable: 'purchase_order_items',
      headerFk: 'purchase_order_id',
      headerPermittedFields: ['notes', 'expected_date', 'warehouse_id', 'payment_terms',
        'currency', 'supplier_id'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      autoLineNumber: true,
      softDeleteItems: true,
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  const permitted = ['notes', 'expected_date', 'warehouse_id', 'payment_terms',
    'currency', 'supplier_id'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  if (Object.keys(allowed).length === 0) {
    return c.json({ data: { id } });
  }

  const { data, error } = await db
    .from('purchase_orders')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseOrder', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/purchase-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'purchase_orders', c.req.param('id'), user.organizationId, 'PurchaseOrder', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Order Workflow — submit / approve / reject
// ────────────────────────────────────────────────────────────────────────────

// POST /purchase-orders/:id/submit — draft → submitted
procurement.post('/purchase-orders/:id/submit', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'purchase_orders', id, user.organizationId, 'draft', {
    status: 'submitted', submitted_at: new Date().toISOString(), submitted_by: user.userId,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseOrder', 'unknown', 'submit', requestId);
  return c.json({ data });
});

// POST /purchase-orders/:id/approve — submitted → approved
procurement.post('/purchase-orders/:id/approve', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'purchase_orders', id, user.organizationId, 'submitted', {
    status: 'approved', approved_at: new Date().toISOString(), approved_by: user.userId,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseOrder', 'unknown', 'approve', requestId);
  return c.json({ data });
});

// POST /purchase-orders/:id/reject — submitted → rejected
procurement.post('/purchase-orders/:id/reject', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { data, error } = await atomicStatusTransition(db, 'purchase_orders', id, user.organizationId, 'submitted', {
    status: 'rejected', rejected_at: new Date().toISOString(), rejected_by: user.userId, rejection_reason: body.reason ?? null,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseOrder', 'unknown', 'reject', requestId);
  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Order Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const poItemsConfig: CrudConfig = {
  table: 'purchase_order_items',
  path: '/purchase-order-items',
  resourceName: 'PurchaseOrderItem',
  listSelect: 'id, line_number, quantity, received_quantity, invoiced_quantity, unit_price, tax_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, quantity, unit_price',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'purchase_order_id', parentTable: 'purchase_orders' },
};
procurement.route('', buildCrudRoutes(poItemsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Purchase Requisitions — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/purchase-requisitions', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('purchase_requisitions')
    .select(
      'id, requisition_number, request_date, required_date, total_amount, status, department:departments(id,name), requester:employees!purchase_requisitions_requester_id_fkey(id,name)',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
procurement.get('/purchase-requisitions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('purchase_requisitions')
    .select('*, lines:purchase_requisition_lines(*, product:products(id,name,code)), department:departments(id,name), requester:employees!purchase_requisitions_requester_id_fkey(id,name)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('PurchaseRequisition', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + lines)
procurement.post('/purchase-requisitions', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate requisition_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'purchase_requisition',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate requisition number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  // Resolve employee ID from auth user for created_by FK
  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'purchase_requisitions',
      itemsTable: 'purchase_requisition_lines',
      headerFk: 'purchase_requisition_id',
      headerReturnSelect: 'id, requisition_number, status',
      itemsReturnSelect: 'id, product_id, quantity, unit_price',
    },
    {
      header: {
        ...headerFields,
        requisition_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: empId,
      },
      items: items ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_purchase_requisition',
      resource: 'purchase_requisitions',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurement.put('/purchase-requisitions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'purchase_requisitions',
      itemsTable: 'purchase_requisition_lines',
      headerFk: 'purchase_requisition_id',
      headerPermittedFields: ['notes'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      autoLineNumber: true,
      softDeleteItems: true,
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['notes']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('purchase_requisitions')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('PurchaseRequisition', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('purchase_requisitions')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseRequisition', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/purchase-requisitions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'purchase_requisitions', c.req.param('id'), user.organizationId, 'PurchaseRequisition', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Requisition Workflow — submit / approve / reject
// ────────────────────────────────────────────────────────────────────────────

// POST /purchase-requisitions/:id/submit — draft → submitted
procurement.post('/purchase-requisitions/:id/submit', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'purchase_requisitions', id, user.organizationId, 'draft', {
    status: 'submitted', submitted_at: new Date().toISOString(), submitted_by: user.userId,
  }, 'id, requisition_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseRequisition', 'unknown', 'submit', requestId);
  return c.json({ data });
});

// POST /purchase-requisitions/:id/approve — submitted → approved
procurement.post('/purchase-requisitions/:id/approve', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'purchase_requisitions', id, user.organizationId, 'submitted', {
    status: 'approved', approved_at: new Date().toISOString(), approved_by: user.userId,
  }, 'id, requisition_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseRequisition', 'unknown', 'approve', requestId);
  return c.json({ data });
});

// POST /purchase-requisitions/:id/reject — submitted → rejected
procurement.post('/purchase-requisitions/:id/reject', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { data, error } = await atomicStatusTransition(db, 'purchase_requisitions', id, user.organizationId, 'submitted', {
    status: 'rejected', rejected_at: new Date().toISOString(), rejected_by: user.userId, rejection_reason: body.reason ?? null,
  }, 'id, requisition_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PurchaseRequisition', 'unknown', 'reject', requestId);
  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// RFQ Headers — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/rfq-headers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('rfq_headers')
    .select('id, rfq_number, due_date, status, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
procurement.get('/rfq-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('rfq_headers')
    .select('*, lines:rfq_lines(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('RfqHeader', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + lines)
procurement.post('/rfq-headers', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate rfq_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'rfq',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate RFQ number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'rfq_headers',
      itemsTable: 'rfq_lines',
      headerFk: 'rfq_id',
      headerReturnSelect: 'id, rfq_number, status',
      itemsReturnSelect: 'id, product_id, qty_requested',
    },
    {
      header: {
        ...headerFields,
        rfq_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: empId,
      },
      items: items ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_rfq',
      resource: 'rfq_headers',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurement.put('/rfq-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'rfq_headers',
      itemsTable: 'rfq_lines',
      headerFk: 'rfq_id',
      headerPermittedFields: ['notes', 'due_date'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      autoLineNumber: true,
      softDeleteItems: true,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['notes', 'due_date']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('rfq_headers')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('RfqHeader', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('rfq_headers')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('RfqHeader', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/rfq-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'rfq_headers', c.req.param('id'), user.organizationId, 'RfqHeader', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Supplier Quotations — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/supplier-quotations', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('supplier_quotations')
    .select(
      'id, quotation_number, validity_date, currency, status, supplier:suppliers(id,name), rfq:rfq_headers(id,rfq_number)',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
procurement.get('/supplier-quotations/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('supplier_quotations')
    .select('*, lines:supplier_quotation_lines(*, product:products(id,name,code)), supplier:suppliers(id,name,code), rfq:rfq_headers(id,rfq_number)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SupplierQuotation', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + lines)
procurement.post('/supplier-quotations', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate quotation_number via RPC
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'supplier_quotation',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate quotation number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'supplier_quotations',
      itemsTable: 'supplier_quotation_lines',
      headerFk: 'quotation_id',
      headerReturnSelect: 'id, quotation_number, status',
      itemsReturnSelect: 'id, product_id, qty_offered, unit_price',
    },
    {
      header: {
        ...headerFields,
        quotation_number: seqData,
        organization_id: user.organizationId,
        status: 'received',
      },
      items: items ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_supplier_quotation',
      resource: 'supplier_quotations',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurement.put('/supplier-quotations/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'supplier_quotations',
      itemsTable: 'supplier_quotation_lines',
      headerFk: 'quotation_id',
      headerPermittedFields: ['notes', 'validity_date', 'total_amount', 'currency'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      softDeleteItems: true,
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.total_price) || (Number(it.qty_offered) || 0) * (Number(it.unit_price) || 0), sumExpr: 'COALESCE(total_price, qty_offered * unit_price, 0)' },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['notes', 'validity_date', 'total_amount', 'currency']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('supplier_quotations')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('SupplierQuotation', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('supplier_quotations')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierQuotation', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/supplier-quotations/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'supplier_quotations', c.req.param('id'), user.organizationId, 'SupplierQuotation', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Requisition Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const prLinesConfig: CrudConfig = {
  table: 'purchase_requisition_lines',
  path: '/purchase-requisition-lines',
  resourceName: 'PurchaseRequisitionLine',
  listSelect: 'id, line_number, quantity, unit_price, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, quantity',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'purchase_requisition_id', parentTable: 'purchase_requisitions' },
};
procurement.route('', buildCrudRoutes(prLinesConfig));

// ────────────────────────────────────────────────────────────────────────────
// RFQ Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const rfqLinesConfig: CrudConfig = {
  table: 'rfq_lines',
  path: '/rfq-lines',
  resourceName: 'RfqLine',
  listSelect: 'id, line_number, qty_requested, unit_of_measure, description, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, qty_requested',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'rfq_id', parentTable: 'rfq_headers' },
};
procurement.route('', buildCrudRoutes(rfqLinesConfig));

// ────────────────────────────────────────────────────────────────────────────
// Supplier Quotation Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const sqLinesConfig: CrudConfig = {
  table: 'supplier_quotation_lines',
  path: '/supplier-quotation-lines',
  resourceName: 'SupplierQuotationLine',
  listSelect: 'id, qty_offered, unit_price, total_price, lead_time_days, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, qty_offered, unit_price',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'quotation_id', parentTable: 'supplier_quotations' },
};
procurement.route('', buildCrudRoutes(sqLinesConfig));

export default procurement;
