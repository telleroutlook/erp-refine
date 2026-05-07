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
    .select('*, supplier:suppliers(id,name,code,contact_email,contact_phone), contract:contracts(id,contract_number,status), source_requisition:purchase_requisitions(id,requisition_number), items:purchase_order_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('PurchaseOrder', id, requestId);
  return c.json({ data });
});

// GET create-from: PR → PO (enhanced: contract matching + supplier grouping)
// Returns grouped PO previews, one per supplier, with contract info attached.
procurement.get('/purchase-orders/create-from/purchase-requisition/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('purchase_requisition', 'purchase_order')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully fulfilled', requestId);

  // For each PR line, find active contracts to determine supplier
  interface LineWithContract {
    item: Record<string, unknown>;
    openQuantity: number;
    contract?: { contract_id: string; contract_number: string; supplier_id: string; unit_price: number; remaining_quantity: number; currency: string };
    supplier_id: string | null;
    needs_selection: boolean;
    available_contracts?: Array<{ contract_id: string; contract_number: string; supplier_id: string; unit_price: number; remaining_quantity: number; currency: string }>;
  }

  const enrichedLines: LineWithContract[] = [];

  for (const { item, openQuantity } of items) {
    const productId = item.product_id as string;

    // Call RPC to find active contracts for this product
    const { data: contracts } = await db.rpc('find_active_contracts_for_product', {
      p_organization_id: user.organizationId,
      p_product_id: productId,
    });

    const validContracts = (contracts ?? []).filter((ct: any) => ct.remaining_quantity > 0);

    if (validContracts.length === 1) {
      // Single contract → auto-assign supplier
      const ct = validContracts[0];
      enrichedLines.push({
        item, openQuantity,
        contract: ct,
        supplier_id: ct.supplier_id,
        needs_selection: false,
      });
    } else if (validContracts.length > 1) {
      // Multiple contracts → needs buyer selection
      enrichedLines.push({
        item, openQuantity,
        supplier_id: null,
        needs_selection: true,
        available_contracts: validContracts,
      });
    } else {
      // No contract → use suggested_supplier_id from PR line
      enrichedLines.push({
        item, openQuantity,
        supplier_id: (item.suggested_supplier_id as string) ?? null,
        needs_selection: !(item.suggested_supplier_id),
      });
    }
  }

  // Check if any line needs manual selection
  const needsSelection = enrichedLines.some((l) => l.needs_selection);

  if (needsSelection) {
    // Return lines with available contracts for frontend selection UI
    return c.json({
      data: {
        status: 'needs_supplier_selection',
        source: { id: source.id, type: 'purchase_requisition', number: source.requisition_number },
        lines: enrichedLines.map((l) => ({
          requisition_line_id: l.item.id,
          product_id: l.item.product_id,
          product: l.item.product,
          quantity: l.openQuantity,
          suggested_supplier_id: l.item.suggested_supplier_id ?? null,
          assigned_supplier_id: l.supplier_id,
          assigned_contract: l.contract ?? null,
          needs_selection: l.needs_selection,
          available_contracts: l.available_contracts ?? [],
        })),
      },
    });
  }

  // All lines have determined suppliers → group by supplier_id
  const supplierGroups = new Map<string, LineWithContract[]>();
  for (const line of enrichedLines) {
    const sid = line.supplier_id!;
    if (!supplierGroups.has(sid)) supplierGroups.set(sid, []);
    supplierGroups.get(sid)!.push(line);
  }

  // Build one PO preview per supplier
  const poPreview = Array.from(supplierGroups.entries()).map(([supplierId, lines]) => {
    const firstContract = lines.find((l) => l.contract);
    return {
      supplier_id: supplierId,
      contract_id: firstContract?.contract?.contract_id ?? null,
      contract_number: firstContract?.contract?.contract_number ?? null,
      currency: firstContract?.contract?.currency ?? 'CNY',
      source_requisition_id: source.id,
      items: lines.map((l) => ({
        product_id: l.item.product_id,
        product: l.item.product,
        quantity: l.openQuantity,
        unit_price: l.contract?.unit_price ?? l.item.unit_price ?? (l.item.product as any)?.cost_price ?? 0,
        contract_item_id: l.contract?.contract_id ? undefined : undefined, // will be resolved on actual create
        contract_unit_price: l.contract?.unit_price ?? null,
        requisition_line_id: l.item.id,
        tax_rate: 0,
      })),
    };
  });

  return c.json({
    data: {
      status: 'ready',
      source: { id: source.id, type: 'purchase_requisition', number: source.requisition_number },
      purchase_orders: poPreview,
    },
  });
});

// POST /purchase-orders/create-from-requisition — batch create POs from PR (after supplier selection)
// Body: { source_requisition_id, purchase_orders: [{ supplier_id, contract_id?, items: [...] }] }
procurement.post('/purchase-orders/create-from-requisition', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { source_requisition_id, purchase_orders: poSpecs } = body;

  if (!source_requisition_id || !Array.isArray(poSpecs) || poSpecs.length === 0) {
    throw ApiError.badRequest('source_requisition_id and purchase_orders array are required', requestId);
  }

  // Validate source PR is approved
  const { data: pr, error: prErr } = await db
    .from('purchase_requisitions')
    .select('id, status, requisition_number')
    .eq('id', source_requisition_id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (prErr || !pr) throw ApiError.notFound('PurchaseRequisition', source_requisition_id, requestId);
  if (pr.status !== 'approved') throw ApiError.invalidState('PurchaseRequisition', pr.status, 'create-from', requestId);

  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
  const createdPOs: Array<{ id: string; order_number: string; supplier_id: string }> = [];

  for (const spec of poSpecs) {
    const { supplier_id, contract_id, items } = spec;
    if (!supplier_id || !Array.isArray(items) || items.length === 0) continue;

    // Generate PO number
    const { data: poNum, error: seqErr } = await db.rpc('get_next_sequence', {
      p_organization_id: user.organizationId,
      p_sequence_name: 'purchase_order',
    });
    if (seqErr || !poNum) throw ApiError.database(`PO number generation failed: ${seqErr?.message}`, requestId);

    const result = await atomicCreateWithItems(db, {
      headerTable: 'purchase_orders',
      itemsTable: 'purchase_order_items',
      headerFk: 'purchase_order_id',
      headerReturnSelect: 'id, order_number, status',
      itemsReturnSelect: 'id, product_id, quantity, unit_price',
      autoLineNumber: true,
    }, {
      header: {
        order_number: poNum,
        organization_id: user.organizationId,
        supplier_id,
        contract_id: contract_id ?? null,
        source_requisition_id,
        order_date: new Date().toISOString().split('T')[0],
        currency: spec.currency ?? 'CNY',
        payment_terms: spec.payment_terms ?? null,
        status: 'draft',
        created_by: empId,
      },
      items: items.map((it: any) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price ?? 0,
        tax_rate: it.tax_rate ?? 0,
        contract_item_id: it.contract_item_id ?? null,
        contract_unit_price: it.contract_unit_price ?? null,
        requisition_line_id: it.requisition_line_id ?? null,
      })),
    }, {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_purchase_order',
      resource: 'purchase_orders',
    });

    createdPOs.push({ id: result.header.id as string, order_number: result.header.order_number as string, supplier_id });

    // Document relation
    await createDocumentRelation(db, user.organizationId,
      'purchase_requisition', source_requisition_id, 'purchase_order', result.header.id as string,
      'PR → PO (grouped)');
  }

  // Mark PR as converted
  await db
    .from('purchase_requisitions')
    .update({ status: 'converted' })
    .eq('id', source_requisition_id)
    .eq('organization_id', user.organizationId)
    .eq('status', 'approved');

  return c.json({ data: { created_purchase_orders: createdPOs } }, 201);
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

  const { items, _sourceRef, ...rawFields } = body;

  const PERMITTED_PO_CREATE = new Set([
    'supplier_id', 'order_date', 'expected_date', 'delivery_date',
    'currency', 'payment_terms', 'notes', 'warehouse_id', 'contact_person',
    'contract_id', 'source_requisition_id',
  ]);
  const headerFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawFields)) {
    if (PERMITTED_PO_CREATE.has(k)) headerFields[k] = v;
  }

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

  // Only draft POs can be edited
  const { data: existing, error: fetchErr } = await db
    .from('purchase_orders')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (fetchErr || !existing) throw ApiError.notFound('PurchaseOrder', id, requestId);
  if (existing.status !== 'draft') throw ApiError.invalidState('PurchaseOrder', existing.status, 'update', requestId);

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
// Supplier Quotation → Contract conversion
// ────────────────────────────────────────────────────────────────────────────

// POST /supplier-quotations/:id/convert-to-contract
// Converts a selected quotation (or selected lines) into a procurement contract.
// Body: { line_ids?: string[], start_date?, end_date?, payment_terms?, notes? }
procurement.post('/supplier-quotations/:id/convert-to-contract', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const quotationId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  // 1. Fetch quotation with lines
  const { data: quotation, error: fetchErr } = await db
    .from('supplier_quotations')
    .select('*, lines:supplier_quotation_lines(*, product:products(id,name,code)), supplier:suppliers(id,name), rfq:rfq_headers(id,rfq_number)')
    .eq('id', quotationId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !quotation) throw ApiError.notFound('SupplierQuotation', quotationId, requestId);

  // Only selected or evaluated quotations can be converted
  if (!['selected', 'evaluated'].includes(quotation.status)) {
    throw ApiError.invalidState('SupplierQuotation', quotation.status, 'convert-to-contract', requestId,
      'Quotation must be in "selected" or "evaluated" status to convert');
  }

  // 2. Determine which lines to include
  const allLines = ((quotation.lines ?? []) as any[]).filter((l: any) => !l.deleted_at);
  const lineIds: string[] | undefined = body.line_ids;
  const linesToConvert = lineIds
    ? allLines.filter((l: any) => lineIds.includes(l.id))
    : allLines;

  if (linesToConvert.length === 0) {
    throw ApiError.badRequest('No valid quotation lines to convert', requestId);
  }

  // 3. Generate contract number
  const { data: contractNum, error: seqErr } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'contract',
  });
  if (seqErr || !contractNum) throw ApiError.database(`Contract number generation failed: ${seqErr?.message ?? 'unavailable'}`, requestId);

  // 4. Compute total
  const totalAmount = linesToConvert.reduce((sum: number, l: any) =>
    sum + (Number(l.total_price) || Number(l.qty_offered) * Number(l.unit_price) || 0), 0);

  // 5. Create contract with items
  const result = await atomicCreateWithItems(db, {
    headerTable: 'contracts',
    itemsTable: 'contract_items',
    headerFk: 'contract_id',
    headerReturnSelect: 'id, contract_number, status',
    itemsReturnSelect: 'id, product_id, quantity, unit_price, source_quotation_line_id',
  }, {
    header: {
      contract_number: contractNum,
      organization_id: user.organizationId,
      contract_type: 'procurement',
      party_type: 'supplier',
      party_id: quotation.supplier_id,
      currency: quotation.currency,
      total_amount: totalAmount,
      start_date: body.start_date ?? new Date().toISOString().split('T')[0],
      end_date: body.end_date ?? null,
      payment_terms: body.payment_terms ?? null,
      notes: body.notes ?? `Converted from quotation ${quotation.quotation_number}`,
      source_quotation_id: quotationId,
      source_rfq_id: quotation.rfq_id ?? null,
      status: 'draft',
      created_by: user.userId,
    },
    items: linesToConvert.map((l: any) => ({
      product_id: l.product_id,
      quantity: l.qty_offered,
      unit_price: l.unit_price,
      amount: Number(l.total_price) || Number(l.qty_offered) * Number(l.unit_price) || 0,
      tax_rate: 0,
      source_quotation_line_id: l.id,
      status: 'active',
    })),
  });

  // 6. Update quotation status → contracted
  await db
    .from('supplier_quotations')
    .update({ status: 'contracted' })
    .eq('id', quotationId)
    .eq('organization_id', user.organizationId);

  // 7. Record document relation
  await createDocumentRelation(db, user.organizationId,
    'supplier_quotation', quotationId, 'contract', result.header.id as string,
    'Quotation → Contract');

  return c.json({ data: result.header }, 201);
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
