// src/routes/inventory.ts
// Inventory REST API — Stock records, transactions, lots, serial numbers, reservations, counts

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { adjustStock, createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';

const inventory = new Hono<{ Bindings: Env }>();
inventory.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Stock Records — list (with computed qty_available) + detail
// ────────────────────────────────────────────────────────────────────────────

inventory.get('/stock-records', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('stock_records')
    .select('id, qty_on_hand, qty_reserved, product:products(id,name,code), warehouse:warehouses(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list StockRecords. Check sort field '${sortField}' exists.`);
  const result = (data ?? []).map((r: any) => ({ ...r, qty_available: r.qty_on_hand - r.qty_reserved }));
  return c.json({ data: result, total: count ?? 0, page, pageSize });
});

inventory.get('/stock-records/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('stock_records')
    .select('*, product:products(id,name,code), warehouse:warehouses(id,name,code)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (error) throw ApiError.notFound('StockRecord', id, requestId);
  return c.json({
    data: { ...data, qty_available: (data as any).qty_on_hand - (data as any).qty_reserved },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Stock Transactions — list only (immutable audit trail)
// ────────────────────────────────────────────────────────────────────────────

const stockTransactionsConfig: CrudConfig = {
  table: 'stock_transactions',
  path: '/stock-transactions',
  resourceName: 'StockTransaction',
  listSelect: 'id, transaction_type, quantity, reference_type, reference_id, lot_number, cost_price, notes, created_at, product:products(id,name,code), warehouse:warehouses(id,name)',
  detailSelect: '*, product:products(id,name,code), warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, transaction_type, quantity',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
inventory.route('', buildCrudRoutes(stockTransactionsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Inventory Lots — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const inventoryLotsConfig: CrudConfig = {
  table: 'inventory_lots',
  path: '/inventory-lots',
  resourceName: 'InventoryLot',
  listSelect: 'id, lot_number, supplier_lot_number, manufacture_date, expiry_date, quantity, status, product:products(id,name,code), warehouse:warehouses(id,name)',
  detailSelect: '*, product:products(id,name,code), warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, lot_number, quantity',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
};
inventory.route('', buildCrudRoutes(inventoryLotsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Serial Numbers — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const serialNumbersConfig: CrudConfig = {
  table: 'serial_numbers',
  path: '/serial-numbers',
  resourceName: 'SerialNumber',
  listSelect: 'id, serial_number, status, product:products(id,name,code), warehouse:warehouses(id,name)',
  detailSelect: '*, product:products(id,name,code), warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, serial_number, status',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
};
inventory.route('', buildCrudRoutes(serialNumbersConfig));

// ────────────────────────────────────────────────────────────────────────────
// Inventory Reservations — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const inventoryReservationsConfig: CrudConfig = {
  table: 'inventory_reservations',
  path: '/inventory-reservations',
  resourceName: 'InventoryReservation',
  listSelect: 'id, reserved_qty, reference_type, reference_id, status, expires_at, product:products(id,name,code), warehouse:warehouses(id,name)',
  detailSelect: '*, product:products(id,name,code), warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, reserved_qty, status',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
};
inventory.route('', buildCrudRoutes(inventoryReservationsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Inventory Counts — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
inventory.get('/inventory-counts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('inventory_counts')
    .select(
      'id, count_number, count_date, count_type, status, warehouse:warehouses(id,name)',
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
inventory.get('/inventory-counts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('inventory_counts')
    .select('*, lines:inventory_count_lines(*, product:products(id,name,code)), warehouse:warehouses(id,name,code)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('InventoryCount', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + lines)
inventory.post('/inventory-counts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate count_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'inventory_count',
  });
  if (seqError) throw ApiError.database(`Failed to generate count number: ${seqError.message}`, requestId);

  const { lines, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'inventory_counts',
      itemsTable: 'inventory_count_lines',
      headerFk: 'inventory_count_id',
      headerReturnSelect: 'id, count_number, status',
      itemsReturnSelect: 'id, product_id, system_qty, counted_qty, variance_qty',
    },
    {
      header: {
        ...headerFields,
        count_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
      },
      items: lines ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_inventory_count',
      resource: 'inventory_counts',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
inventory.put('/inventory-counts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('inventory_counts')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('InventoryCount', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
inventory.delete('/inventory-counts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('inventory_counts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /inventory-counts/:id/complete — finalize count with variance adjustments
// ────────────────────────────────────────────────────────────────────────────

inventory.post('/inventory-counts/:id/complete', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get count with lines
  const { data: countDoc, error: fetchError } = await db
    .from('inventory_counts')
    .select('*, lines:inventory_count_lines(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !countDoc) throw ApiError.notFound('InventoryCount', id, requestId);

  // 2. Validate status (must be 'in_progress' or 'counted')
  if (countDoc.status !== 'in_progress' && countDoc.status !== 'counted') {
    throw ApiError.invalidState('InventoryCount', countDoc.status, 'complete', requestId);
  }

  // 3. For each line with variance, create stock adjustment transaction
  for (const line of countDoc.lines) {
    const varianceQty = (line.counted_qty ?? 0) - (line.system_qty ?? 0);
    if (varianceQty === 0) continue;

    // Adjust stock to match counted qty
    await adjustStock(db, {
      organizationId: user.organizationId,
      warehouseId: countDoc.warehouse_id,
      productId: line.product_id,
      qtyDelta: varianceQty,
    }, requestId);

    // Record adjustment transaction
    await createStockTransaction(db, {
      organizationId: user.organizationId,
      warehouseId: countDoc.warehouse_id,
      productId: line.product_id,
      transactionType: 'adjust',
      qty: Math.abs(varianceQty),
      referenceType: 'inventory_count',
      referenceId: countDoc.id,
      notes: `Count variance: system=${line.system_qty}, counted=${line.counted_qty}, diff=${varianceQty}`,
      createdBy: user.userId,
    }, requestId);

    // Update the line with the computed variance
    await db
      .from('inventory_count_lines')
      .update({ variance_qty: varianceQty })
      .eq('id', line.id);
  }

  // 4. Update count status to 'completed'
  const { error: updateError } = await db
    .from('inventory_counts')
    .update({
      status: 'completed',
      completed_by: user.userId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({
    data: { id: countDoc.id, count_number: countDoc.count_number, status: 'completed' },
  });
});

export default inventory;
