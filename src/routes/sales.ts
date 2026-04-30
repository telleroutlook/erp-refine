// src/routes/sales.ts
// Sales REST API — SOs (atomic), SO Items, Shipments, Shipment Confirm

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { createStockTransaction, batchCreateStockTransactions } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { findFlow } from '../utils/document-flow';
import { fetchSourceWithOpenQuantities, buildPrefilledData, createDocumentRelation, validateItemsAgainstSource } from '../utils/create-from-helpers';

const sales = new Hono<{ Bindings: Env }>();
sales.use('*', authMiddleware());
sales.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Sales Orders — custom CRUD with atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
sales.get('/sales-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'sales_order_items' };

  const baseSelect = 'id, order_number, status, order_date, total_amount, currency, customer:customers(id,name)';
  let query = db
    .from('sales_orders')
    .select(buildSelectWithItemFilter(baseSelect, itemJoin, itemFilters), { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  query = applyItemFilters(query, itemJoin, itemFilters);
  const { data, count, error } = await query
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
      autoLineNumber: true,
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

// PUT update (atomic: header + items when body.items present)
sales.put('/sales-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['status', 'notes', 'delivery_date', 'warehouse_id', 'payment_terms',
    'currency', 'customer_id', 'approved_by', 'approved_at'];

  if (body.items) {
    const { items, ...headerFields } = body;
    const result = await atomicUpdateWithItems(
      db,
      {
        headerTable: 'sales_orders',
        itemsTable: 'sales_order_items',
        headerFk: 'sales_order_id',
        headerPermittedFields: permitted,
        itemsReturnSelect: '*, product:products(id,name,code)',
        headerReturnSelect: 'id',
        autoLineNumber: true,
        autoSum: {
          headerField: 'total_amount',
          itemAmountExpr: (item) => {
            const amount = Number(item.amount);
            if (!isNaN(amount)) return amount;
            return Number(item.quantity ?? 0) * Number(item.unit_price ?? 0);
          },
        },
      },
      id,
      user.organizationId,
      { header: headerFields, items },
      requestId,
    );
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('sales_orders')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesOrder', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
sales.delete('/sales-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'sales_orders', c.req.param('id'), user.organizationId, 'SalesOrder', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Order Workflow — submit / approve / reject / cancel
// ────────────────────────────────────────────────────────────────────────────

// POST /sales-orders/:id/submit — draft → submitted
sales.post('/sales-orders/:id/submit', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'sales_orders', id, user.organizationId, 'draft', {
    status: 'submitted', submitted_at: new Date().toISOString(), submitted_by: user.userId,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('SalesOrder', 'unknown', 'submit', requestId);
  return c.json({ data });
});

// POST /sales-orders/:id/approve — submitted → approved
sales.post('/sales-orders/:id/approve', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const { data, error } = await atomicStatusTransition(db, 'sales_orders', id, user.organizationId, 'submitted', {
    status: 'approved', approved_at: new Date().toISOString(), approved_by: user.userId,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('SalesOrder', 'unknown', 'approve', requestId);
  return c.json({ data });
});

// POST /sales-orders/:id/reject — submitted → rejected
sales.post('/sales-orders/:id/reject', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { data, error } = await atomicStatusTransition(db, 'sales_orders', id, user.organizationId, 'submitted', {
    status: 'rejected', rejected_at: new Date().toISOString(), rejected_by: user.userId, rejection_reason: body.reason ?? null,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('SalesOrder', 'unknown', 'reject', requestId);
  return c.json({ data });
});

// POST /sales-orders/:id/cancel — draft/submitted/approved → cancelled
sales.post('/sales-orders/:id/cancel', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { data, error } = await atomicStatusTransition(db, 'sales_orders', id, user.organizationId, ['approved', 'submitted', 'draft'], {
    status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: user.userId, cancellation_reason: body.reason ?? null,
  }, 'id, order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('SalesOrder', 'unknown', 'cancel', requestId);
  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Order Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const soItemsConfig: CrudConfig = {
  table: 'sales_order_items',
  path: '/sales-order-items',
  resourceName: 'SalesOrderItem',
  listSelect: 'id, line_number, quantity, shipped_quantity, unit_price, tax_rate, discount_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_number, quantity, unit_price',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'sales_order_id', parentTable: 'sales_orders' },
};
sales.route('', buildCrudRoutes(soItemsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Sales Shipments — atomic create (header + items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
sales.get('/sales-shipments', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'sales_shipment_items' };

  const baseSelect = 'id, shipment_number, shipment_date, tracking_number, carrier, status, sales_order:sales_orders(id,order_number,customer:customers(id,name)), warehouse:warehouses(id,name)';
  let query = db
    .from('sales_shipments')
    .select(buildSelectWithItemFilter(baseSelect, itemJoin, itemFilters), { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  query = applyItemFilters(query, itemJoin, itemFilters);
  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET create-from: SO → Sales Shipment (参考销售订单创建发货单)
sales.get('/sales-shipments/create-from/sales-order/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('sales_order', 'sales_shipment')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully shipped', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// GET detail
sales.get('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_shipments')
    .select('*, items:sales_shipment_items(*, product:products(id,name,code)), sales_order:sales_orders(id,order_number,customer:customers(id,name)), warehouse:warehouses(id,name,code)')
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

  const { items, _sourceRef, ...headerFields } = body;

  // Validate quantities against source open items
  if (_sourceRef?.type === 'sales_order' && _sourceRef?.id && items?.length) {
    const flow = findFlow('sales_order', 'sales_shipment')!;
    await validateItemsAgainstSource(db, flow, _sourceRef.id, items, user.organizationId, requestId);
  }

  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'sales_shipments',
      itemsTable: 'sales_shipment_items',
      headerFk: 'sales_shipment_id',
      headerReturnSelect: 'id, shipment_number, status',
      itemsReturnSelect: 'id, product_id, quantity',
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

  if (_sourceRef?.type && _sourceRef?.id) {
    await createDocumentRelation(db, user.organizationId, _sourceRef.type, _sourceRef.id, 'sales_shipment', result.header.id as string, `${_sourceRef.type} → sales_shipment`);
  }

  return c.json({ data: result.header }, 201);
});

// PUT update (atomic: header + items when body.items present)
sales.put('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permittedFields = ['status', 'notes', 'shipment_date', 'carrier', 'tracking_number', 'warehouse_id'];

  if (body.items) {
    const { items, ...headerFields } = body;
    const result = await atomicUpdateWithItems(
      db,
      {
        headerTable: 'sales_shipments',
        itemsTable: 'sales_shipment_items',
        headerFk: 'sales_shipment_id',
        headerPermittedFields: permittedFields,
        itemsReturnSelect: '*, product:products(id,name,code)',
        headerReturnSelect: 'id',
      },
      id,
      user.organizationId,
      { header: headerFields, items },
      requestId,
    );
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(permittedFields);
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
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesShipment', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
sales.delete('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'sales_shipments', c.req.param('id'), user.organizationId, 'SalesShipment', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /sales-shipments/:id/confirm — stock deduction + SO shipped_qty update
// ────────────────────────────────────────────────────────────────────────────

sales.post('/sales-shipments/:id/confirm', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Fetch shipment with items
  const { data: shipment, error: fetchError } = await db
    .from('sales_shipments')
    .select('id, status, shipment_number, warehouse_id, organization_id, sales_order_id, items:sales_shipment_items(id, product_id, quantity, sales_order_item_id)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !shipment) throw ApiError.notFound('SalesShipment', id, requestId);
  if (shipment.status !== 'draft') {
    throw ApiError.invalidState('SalesShipment', shipment.status, 'confirm', requestId);
  }
  if (!shipment.warehouse_id) {
    throw ApiError.badRequest('Warehouse is required to confirm a shipment', requestId);
  }

  // 2. Atomic status transition to prevent duplicate processing
  const { data: transitioned, error: updateError } = await atomicStatusTransition(
    db, 'sales_shipments', id, user.organizationId,
    'draft',
    { status: 'confirmed', confirmed_by: user.userId, confirmed_at: new Date().toISOString() }
  );
  if (updateError) throw ApiError.database((updateError as any).message, requestId);
  if (!transitioned) throw ApiError.invalidState('SalesShipment', shipment.status, 'confirm', requestId);

  // 3. Stock-out transactions (trigger auto-syncs stock_records)
  const items = (shipment as any).items ?? [];
  if (items.length > 0) {
    await batchCreateStockTransactions(db, items.map((item: any) => ({
      organizationId: user.organizationId,
      warehouseId: shipment.warehouse_id!,
      productId: item.product_id,
      transactionType: 'out' as const,
      qty: Number(item.quantity),
      referenceType: 'sales_shipment',
      referenceId: shipment.id,
      createdBy: user.userId,
    })), requestId);

    // Update SO shipped_quantity atomically
    await Promise.all(
      items
        .filter((item: any) => item.sales_order_item_id)
        .map((item: any) =>
          db.rpc('increment_so_shipped_qty', {
            p_soi_id: item.sales_order_item_id,
            p_qty: Number(item.quantity),
          })
        )
    );
  }

  // 4. Auto-progress SO status based on total fulfillment (atomic RPC)
  if (shipment.sales_order_id) {
    await db.rpc('update_so_status_from_items', {
      p_so_id: shipment.sales_order_id,
      p_org_id: user.organizationId,
    });
  }

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

// ────────────────────────────────────────────────────────────────────────────
// Shipment Tracking Events — carrier tracking updates for shipments
// ────────────────────────────────────────────────────────────────────────────

const shipmentTrackingEventsConfig: CrudConfig = {
  table: 'shipment_tracking_events',
  path: '/shipment-tracking-events',
  resourceName: 'ShipmentTrackingEvent',
  listSelect: 'id, shipment_id, event_type, location, occurred_at, notes, created_at',
  detailSelect: '*',
  createReturnSelect: 'id, shipment_id, event_type',
  defaultSort: 'occurred_at',
  softDelete: false,
  orgScoped: true,
};
sales.route('', buildCrudRoutes(shipmentTrackingEventsConfig));

export default sales;
