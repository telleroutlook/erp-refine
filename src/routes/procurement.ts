// src/routes/procurement.ts
// Procurement REST API — POs (atomic), PRs, RFQs, Supplier Quotations

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';

const procurement = new Hono<{ Bindings: Env }>();
procurement.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Purchase Orders — custom CRUD with atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/purchase-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('purchase_orders')
    .select('id, order_number, status, order_date, total_amount, currency, supplier:suppliers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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
    .select('*, supplier:suppliers(id,name,code,contact_email), items:purchase_order_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('PurchaseOrder', id, requestId);
  return c.json({ data });
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

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'purchase_orders',
      itemsTable: 'purchase_order_items',
      headerFk: 'purchase_order_id',
      headerReturnSelect: 'id, order_number, status',
      itemsReturnSelect: 'id, product_id, qty, unit_price',
      autoLineNo: true,
    },
    {
      header: {
        ...headerFields,
        order_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
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

  return c.json({ data: result.header }, 201);
});

// PUT update
procurement.put('/purchase-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('purchase_orders')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseOrder', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/purchase-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('purchase_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Order Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const poItemsConfig: CrudConfig = {
  table: 'purchase_order_items',
  path: '/purchase-order-items',
  resourceName: 'PurchaseOrderItem',
  listSelect: 'id, line_number, qty, received_qty, invoiced_qty, unit_price, tax_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, qty, unit_price',
  defaultSort: 'line_number',
  softDelete: false,
  orgScoped: false,
};
procurement.route('', buildCrudRoutes(poItemsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Suppliers — list only (full CRUD is in partners.ts)
// ────────────────────────────────────────────────────────────────────────────

procurement.get('/suppliers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('suppliers')
    .select('id, name, code, contact_email, contact_phone, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Requisitions — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/purchase-requisitions', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('purchase_requisitions')
    .select(
      'id, requisition_number, request_date, required_date, total_amount, status, department:departments(id,name), requester:employees(id,name), created_at',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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
    .select('*, lines:purchase_requisition_lines(*, product:products(id,name,code)), department:departments(id,name), requester:employees(id,name)')
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

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'purchase_requisitions',
      itemsTable: 'purchase_requisition_lines',
      headerFk: 'purchase_requisition_id',
      headerReturnSelect: 'id, requisition_number, status',
      itemsReturnSelect: 'id, product_id, qty, unit_price',
    },
    {
      header: {
        ...headerFields,
        requisition_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
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

  const { data, error } = await db
    .from('purchase_requisitions')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseRequisition', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/purchase-requisitions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('purchase_requisitions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// RFQ Headers — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/rfq-headers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('rfq_headers')
    .select('id, rfq_number, due_date, status, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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
        created_by: user.userId,
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

  const { data, error } = await db
    .from('rfq_headers')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('RfqHeader', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/rfq-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('rfq_headers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Supplier Quotations — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurement.get('/supplier-quotations', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('supplier_quotations')
    .select(
      'id, quotation_number, validity_date, currency, status, supplier:suppliers(id,name), rfq:rfq_headers(id,rfq_number)',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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
        status: headerFields.status ?? 'draft',
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

  const { data, error } = await db
    .from('supplier_quotations')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierQuotation', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurement.delete('/supplier-quotations/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('supplier_quotations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Requisition Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const prLinesConfig: CrudConfig = {
  table: 'purchase_requisition_lines',
  path: '/purchase-requisition-lines',
  resourceName: 'PurchaseRequisitionLine',
  listSelect: 'id, line_number, qty, estimated_unit_price, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, qty',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
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
};
procurement.route('', buildCrudRoutes(sqLinesConfig));

export default procurement;
