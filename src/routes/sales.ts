// src/routes/sales.ts
// Sales REST API — SOs (atomic), SO Items, Shipments, Shipment Confirm

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';

const sales = new Hono<{ Bindings: Env }>();
sales.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Sales Orders — custom CRUD with atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
sales.get('/sales-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_orders')
    .select('id, order_number, status, order_date, total_amount, currency, customer:customers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list SalesOrders. Check sort field '${sortField}' exists.`);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
sales.get('/sales-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_orders')
    .select('*, customer:customers(id,name,code), items:sales_order_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SalesOrder', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + items)
sales.post('/sales-orders', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate order_number via RPC
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'sales_order',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate SO number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'sales_orders',
      itemsTable: 'sales_order_items',
      headerFk: 'sales_order_id',
      headerReturnSelect: 'id, order_number, status',
      itemsReturnSelect: 'id, product_id, quantity, unit_price',
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
      action: 'create_sales_order',
      resource: 'sales_orders',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
sales.put('/sales-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const allowed: Record<string, unknown> = {};
  const permitted = ['status', 'notes', 'delivery_date', 'warehouse_id', 'payment_terms',
    'shipping_method', 'currency', 'customer_id', 'contract_id', 'approved_by', 'approved_at'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('sales_orders')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesOrder', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
sales.delete('/sales-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('sales_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Order Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const soItemsConfig: CrudConfig = {
  table: 'sales_order_items',
  path: '/sales-order-items',
  resourceName: 'SalesOrderItem',
  listSelect: 'id, line_no, quantity, shipped_quantity, unit_price, tax_rate, discount_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_no, quantity, unit_price',
  defaultSort: 'line_no',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'sales_order_id', parentTable: 'sales_orders' },
};
sales.route('', buildCrudRoutes(soItemsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Customers — list only (full CRUD in partners.ts)
// ────────────────────────────────────────────────────────────────────────────

sales.get('/customers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('customers')
    .select('id, name, code, email, phone, contact, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Shipments — atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
sales.get('/sales-shipments', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_shipments')
    .select(
      'id, shipment_number, shipment_date, tracking_number, status, carrier:carriers(id,name), sales_order:sales_orders(id,order_number), customer:customers(id,name), warehouse:warehouses(id,name)',
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
sales.get('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_shipments')
    .select('*, items:sales_shipment_items(*, product:products(id,name,code)), sales_order:sales_orders(id,order_number), warehouse:warehouses(id,name,code)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SalesShipment', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + items)
sales.post('/sales-shipments', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate shipment_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'sales_shipment',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate shipment number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'sales_shipments',
      itemsTable: 'sales_shipment_items',
      headerFk: 'sales_shipment_id',
      headerReturnSelect: 'id, shipment_number, status',
      itemsReturnSelect: 'id, product_id, qty',
    },
    {
      header: {
        ...headerFields,
        shipment_number: seqData,
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
      action: 'create_sales_shipment',
      resource: 'sales_shipments',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
sales.put('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['status', 'notes', 'shipment_date', 'carrier_id', 'tracking_number', 'warehouse_id']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('sales_shipments')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('SalesShipment', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('sales_shipments')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesShipment', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
sales.delete('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('sales_shipments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /sales-shipments/:id/confirm — stock deduction
// ────────────────────────────────────────────────────────────────────────────

sales.post('/sales-shipments/:id/confirm', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get shipment (no need to fetch items — trigger handles stock/qty/SO-status updates)
  const { data: shipment, error: fetchError } = await db
    .from('sales_shipments')
    .select('id, status, shipment_number')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !shipment) throw ApiError.notFound('SalesShipment', id, requestId);

  // 2. Validate status
  if (shipment.status !== 'draft') {
    throw ApiError.invalidState('SalesShipment', shipment.status, 'confirm', requestId);
  }

  // 3. Update status to 'confirmed' — triggers handle stock transactions,
  //    shipped_quantity on SO items, and SO status automatically.
  const { error: updateError } = await db
    .from('sales_shipments')
    .update({
      status: 'confirmed',
      confirmed_by: user.userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({
    data: { id: shipment.id, shipment_number: shipment.shipment_number, status: 'confirmed' },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Shipment Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

sales.route('', buildCrudRoutes({
  table: 'sales_shipment_items',
  path: '/sales-shipment-items',
  resourceName: 'SalesShipmentItem',
  listSelect: 'id, quantity, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity',
  defaultSort: 'id',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'sales_shipment_id', parentTable: 'sales_shipments' },
}));

export default sales;
