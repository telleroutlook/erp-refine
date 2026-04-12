// src/routes/sales.ts
// Sales REST API — SOs (atomic), SO Items, Shipments, Shipment Confirm

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { adjustStock, createStockTransaction } from '../utils/stock-helpers';
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
  if (seqError) throw ApiError.database(`Failed to generate SO number: ${seqError.message}`, requestId);

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

  const { data, error } = await db
    .from('sales_orders')
    .update(body)
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
  listSelect: 'id, line_no, quantity, shipped_quantity, invoiced_quantity, unit_price, tax_rate, discount_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, line_no, quantity, unit_price',
  defaultSort: 'line_no',
  softDelete: false,
  orgScoped: false,
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
    .select('id, name, code, email, phone, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Invoices — list only (full CRUD in sales-finance.ts)
// ────────────────────────────────────────────────────────────────────────────

sales.get('/sales-invoices', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_invoices')
    .select('id, invoice_number, status, invoice_date, total_amount, currency, customer:customers(id,name)', { count: 'exact' })
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
    .select('*, items:sales_shipment_items(*, product:products(id,name,code)), carrier:carriers(id,name,code), sales_order:sales_orders(id,order_number), warehouse:warehouses(id,name,code)')
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
  if (seqError) throw ApiError.database(`Failed to generate shipment number: ${seqError.message}`, requestId);

  const { items, ...headerFields } = body;
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

  return c.json({ data: result.header }, 201);
});

// PUT update
sales.put('/sales-shipments/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('sales_shipments')
    .update(body)
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

  // 1. Get shipment with items
  const { data: shipment, error: fetchError } = await db
    .from('sales_shipments')
    .select('*, items:sales_shipment_items(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !shipment) throw ApiError.notFound('SalesShipment', id, requestId);

  // 2. Validate status (must be 'picked' or 'packed')
  if (shipment.status !== 'picked' && shipment.status !== 'packed') {
    throw ApiError.invalidState('SalesShipment', shipment.status, 'confirm', requestId);
  }

  // 3. Process each item: deduct stock + record transaction + update SO item shipped_quantity
  for (const item of shipment.items) {
    // 3a. Adjust stock (decrease on-hand)
    await adjustStock(db, {
      organizationId: user.organizationId,
      warehouseId: shipment.warehouse_id,
      productId: item.product_id,
      qtyDelta: -item.quantity,
    }, requestId);

    // 3b. Record stock transaction
    await createStockTransaction(db, {
      organizationId: user.organizationId,
      warehouseId: shipment.warehouse_id,
      productId: item.product_id,
      transactionType: 'out',
      qty: item.quantity,
      referenceType: 'sales_shipment',
      referenceId: shipment.id,
      createdBy: user.userId,
    }, requestId);

    // 3c. Update SO item shipped_quantity
    if (item.sales_order_item_id) {
      const { error: rpcErr } = await db.rpc('increment_field', {
        p_table: 'sales_order_items',
        p_id: item.sales_order_item_id,
        p_field: 'shipped_quantity',
        p_delta: item.quantity,
      }).single();

      // Fallback: manual update if RPC not available
      if (rpcErr) {
        const { data: soItem } = await db
          .from('sales_order_items')
          .select('id, shipped_quantity')
          .eq('id', item.sales_order_item_id)
          .single();

        if (soItem) {
          await db
            .from('sales_order_items')
            .update({ shipped_quantity: (soItem.shipped_quantity ?? 0) + item.quantity })
            .eq('id', soItem.id);
        }
      }
    }
  }

  // 4. Update shipment status to 'shipped'
  const { error: updateError } = await db
    .from('sales_shipments')
    .update({
      status: 'shipped',
      shipped_by: user.userId,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  // 5. Check SO completion: if all items fully shipped, update SO status
  if (shipment.sales_order_id) {
    const { data: soItems } = await db
      .from('sales_order_items')
      .select('id, quantity, shipped_quantity')
      .eq('sales_order_id', shipment.sales_order_id);

    if (soItems && soItems.length > 0) {
      const allShipped = soItems.every(
        (si: { quantity: number; shipped_quantity: number }) => (si.shipped_quantity ?? 0) >= si.quantity
      );
      const someShipped = soItems.some(
        (si: { quantity: number; shipped_quantity: number }) => (si.shipped_quantity ?? 0) > 0
      );

      let soStatus: string | undefined;
      if (allShipped) {
        soStatus = 'shipped';
      } else if (someShipped) {
        soStatus = 'partially_shipped';
      }

      if (soStatus) {
        await db
          .from('sales_orders')
          .update({ status: soStatus })
          .eq('id', shipment.sales_order_id);
      }
    }
  }

  // 6. Return confirmed shipment
  return c.json({
    data: { id: shipment.id, shipment_number: shipment.shipment_number, status: 'shipped' },
  });
});

export default sales;
