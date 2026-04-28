// src/routes/inventory.ts
// Inventory REST API — Stock records, transactions, lots, serial numbers, reservations, counts

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { batchCreateStockTransactions } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';

const inventory = new Hono<{ Bindings: Env }>();
inventory.use('*', authMiddleware());
inventory.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Stock Records — list (with computed available_quantity) + detail
// ────────────────────────────────────────────────────────────────────────────

inventory.get('/stock-records', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'updated_at');
  const filters = parseRefineFilters(c);

  let query = db
    .from('stock_records')
    .select('id, quantity, reserved_quantity, available_quantity, product:products(id,name,code), warehouse:warehouses(id,name,code)', { count: 'exact' })
    .eq('organization_id', user.organizationId);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list StockRecords. Check sort field '${sortField}' exists.`);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
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
  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// Stock Transactions — list only (immutable audit trail)
// ────────────────────────────────────────────────────────────────────────────

const stockTransactionsConfig: CrudConfig = {
  table: 'stock_transactions',
  path: '/stock-transactions',
  resourceName: 'StockTransaction',
  listSelect: 'id, transaction_type, transaction_date, quantity, reference_type, reference_id, notes, created_at, product:products(id,name,code), warehouse:warehouses(id,name)',
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
  listSelect: 'id, lot_number, manufacture_date, expiry_date, quantity, status, product:products(id,name,code), warehouse:warehouses(id,name)',
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
  listSelect: 'id, reserved_quantity, reference_type, reference_id, status, expires_at, product:products(id,name,code), warehouse:warehouses(id,name)',
  detailSelect: '*, product:products(id,name,code), warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, reserved_quantity, status',
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
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'inventory_count_lines' };

  const baseSelect = 'id, count_number, count_date, status, warehouse:warehouses(id,name)';
  let query = db
    .from('inventory_counts')
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
  if (seqError || !seqData) throw ApiError.database(`Failed to generate count number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { lines, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'inventory_counts',
      itemsTable: 'inventory_count_lines',
      headerFk: 'inventory_count_id',
      headerReturnSelect: 'id, count_number, status',
      itemsReturnSelect: 'id, product_id, system_quantity, counted_quantity, variance_quantity',
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

  const permitted = ['status', 'notes', 'count_date', 'warehouse_id'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'inventory_counts',
      itemsTable: 'inventory_count_lines',
      headerFk: 'inventory_count_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      softDeleteItems: false,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('inventory_counts')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('InventoryCount', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
inventory.delete('/inventory-counts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'inventory_counts', c.req.param('id'), user.organizationId, 'InventoryCount', requestId);
  return c.json({ data: { success: true } });
});

// ─── Inventory Count Lines (standalone CRUD) ────────────────────────────────

inventory.route('', buildCrudRoutes({
  table: 'inventory_count_lines',
  path: '/inventory-count-lines',
  resourceName: 'InventoryCountLine',
  listSelect: '*, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, product_id, system_quantity, counted_quantity, variance_quantity, notes',
  orgScoped: false,
  parentOwnership: { parentFk: 'inventory_count_id', parentTable: 'inventory_counts' },
}));

// ────────────────────────────────────────────────────────────────────────────
// POST /inventory-counts/:id/complete — finalize count with variance adjustments
// ────────────────────────────────────────────────────────────────────────────

inventory.post('/inventory-counts/:id/complete', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get count with lines (need lines for variance calculations)
  const { data: countDoc, error: fetchError } = await db
    .from('inventory_counts')
    .select('*, lines:inventory_count_lines(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !countDoc) throw ApiError.notFound('InventoryCount', id, requestId);

  // 2. Validate status before running side effects (must be 'in_progress' or 'counted')
  if (countDoc.status !== 'in_progress') {
    throw ApiError.invalidState('InventoryCount', countDoc.status, 'complete', requestId);
  }

  // 2b. Validate all lines have counted_quantity
  const countLines = countDoc.lines as Record<string, unknown>[];
  const unfilledLines = countLines.filter(
    (l) => l.counted_quantity === null || l.counted_quantity === undefined
  );
  if (unfilledLines.length > 0) {
    throw ApiError.badRequest(`${unfilledLines.length} count line(s) have no counted_quantity. Complete all lines before finalizing.`, requestId);
  }

  // 3. Collect lines with variance and batch-insert a single stock adjustment transaction set
  const stockTxInputs: Parameters<typeof batchCreateStockTransactions>[1] = [];

  for (const line of countDoc.lines as Record<string, unknown>[]) {
    const varianceQty = (line.counted_quantity as number ?? 0) - (line.system_quantity as number ?? 0);
    if (varianceQty === 0) continue;

    stockTxInputs.push({
      organizationId: user.organizationId,
      warehouseId: countDoc.warehouse_id,
      productId: line.product_id as string,
      transactionType: varianceQty > 0 ? 'in' : 'out',
      qty: Math.abs(varianceQty),
      referenceType: 'inventory_count',
      referenceId: countDoc.id,
      notes: `Count variance: system=${line.system_quantity}, counted=${line.counted_quantity}, diff=${varianceQty}`,
      createdBy: user.userId,
    });
  }

  await batchCreateStockTransactions(db, stockTxInputs, requestId);

  // 4. Atomic status transition: in_progress → completed
  const { data, error } = await atomicStatusTransition(db, 'inventory_counts', id, user.organizationId,
    ['in_progress'], { status: 'completed' }, 'id, count_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('InventoryCount', 'unknown', 'complete', requestId);
  return c.json({ data });
});

export default inventory;
