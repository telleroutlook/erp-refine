// src/routes/manufacturing.ts
// Manufacturing REST API — BOM, Work Orders, Production Reporting

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { userRateLimitMiddleware } from '../middleware/rate-limit';
import { buildCrudRoutes, performHardDelete, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';

const manufacturing = new Hono<{ Bindings: Env }>();
manufacturing.use('*', authMiddleware());
manufacturing.use('*', userRateLimitMiddleware());
manufacturing.use('*', writeMethodGuard());

// ─── BOM Headers ────────────────────────────────────────────────────────────

manufacturing.get('/bom-headers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'bom_items' };

  const baseSelect = 'id, bom_number, version, is_active, effective_date, product:products(id,name,code), created_at';
  let query = db
    .from('bom_headers')
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

manufacturing.get('/bom-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('bom_headers')
    .select('*, product:products(id,name,code), items:bom_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('BOM', id, requestId);
  return c.json({ data });
});

manufacturing.post('/bom-headers', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...headerFields } = body;

  // Auto-generate bom_number
  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'bom_header',
  });
  if (seqError || !num) throw ApiError.database(`Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const result = await atomicCreateWithItems(db, {
    headerTable: 'bom_headers',
    itemsTable: 'bom_items',
    headerFk: 'bom_header_id',
    headerReturnSelect: 'id, bom_number',
    itemsReturnSelect: 'id, product_id, quantity, unit, scrap_rate, sequence',
  }, {
    header: {
      ...headerFields,
      bom_number: num,
      organization_id: user.organizationId,
      created_by: user.userId,
    },
    items: items ?? [],
  }, { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_bom', resource: 'bom_headers' });

  return c.json({ data: result.header }, 201);
});

manufacturing.put('/bom-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['notes', 'quantity', 'effective_date', 'is_active', 'version'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'bom_headers',
      itemsTable: 'bom_items',
      headerFk: 'bom_header_id',
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
    .from('bom_headers')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('BOM', id, requestId);
  return c.json({ data });
});

manufacturing.delete('/bom-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'bom_headers', c.req.param('id'), user.organizationId, 'BomHeader', requestId);
  return c.json({ data: { success: true } });
});

// ─── Work Orders ────────────────────────────────────────────────────────────

manufacturing.get('/work-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'work_order_materials' };

  const baseSelect = 'id, work_order_number, planned_quantity, completed_quantity, status, start_date, planned_completion_date, product:products(id,name,code), bom:bom_headers(id,bom_number), created_at';
  let query = db
    .from('work_orders')
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

manufacturing.get('/work-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('work_orders')
    .select('*, product:products(id,name,code), bom:bom_headers(id,bom_number), materials:work_order_materials(*, product:products(id,name,code)), productions:work_order_productions(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Work Order', id, requestId);
  return c.json({ data });
});

manufacturing.post('/work-orders', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate work_order_number
  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'work_order',
  });
  if (seqError || !num) throw ApiError.database(`Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  // Look up BOM items to auto-create work order materials
  let bomItems: any[] = [];
  if (body.bom_header_id) {
    // Verify the BOM header belongs to the caller's org before fetching its items
    const { data: bomHeader, error: bomHeaderErr } = await db
      .from('bom_headers')
      .select('id')
      .eq('id', body.bom_header_id)
      .eq('organization_id', user.organizationId)
      .single();
    if (bomHeaderErr || !bomHeader) throw ApiError.notFound('BomHeader', body.bom_header_id, requestId);

    const { data: bom, error: bomError } = await db
      .from('bom_items')
      .select('product_id, quantity, unit, scrap_rate, sequence')
      .eq('bom_header_id', body.bom_header_id)
      .limit(500);

    if (bomError) throw ApiError.database(`Failed to fetch BOM items: ${bomError.message}`, requestId);
    bomItems = bom ?? [];

    const invalidScrap = bomItems.find((item: any) => (item.scrap_rate || 0) >= 1);
    if (invalidScrap) {
      throw ApiError.validation('Scrap rate must be less than 100%', [{ field: 'scrap_rate', message: 'must be less than 1.0', code: 'invalid_value' }], requestId);
    }
  }

  // Insert work order header — only permitted fields accepted
  const PERMITTED_WO = new Set([
    'bom_header_id', 'product_id', 'planned_quantity', 'warehouse_id',
    'start_date', 'planned_completion_date', 'priority', 'notes',
  ]);
  const { items: _discardedItems, ...headerFields } = body;
  const safeHeader: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headerFields)) {
    if (PERMITTED_WO.has(k)) safeHeader[k] = v;
  }
  const { data: wo, error: woError } = await db
    .from('work_orders')
    .insert({
      ...safeHeader,
      work_order_number: num,
      status: 'draft',
      organization_id: user.organizationId,
      created_by: user.userId,
    })
    .select('id, work_order_number')
    .single();

  if (woError) throw ApiError.database(woError.message, requestId);

  // Create work_order_materials from BOM items, scaled by planned_quantity
  if (bomItems.length > 0) {
    const materials = bomItems.map((item: any) => ({
      work_order_id: wo.id,
      product_id: item.product_id,
      required_quantity: Math.ceil(item.quantity * (body.planned_quantity ?? 1) / (1 - (item.scrap_rate || 0))),
      issued_quantity: 0,
      warehouse_id: body.warehouse_id,
    }));

    const { error: matError } = await db
      .from('work_order_materials')
      .insert(materials);

    if (matError) {
      await db.from('work_orders').delete().eq('id', wo.id).eq('organization_id', user.organizationId);
      throw ApiError.database(`Failed to create work order materials: ${matError.message}`, requestId);
    }
  }

  return c.json({ data: wo }, 201);
});

manufacturing.put('/work-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['notes', 'planned_quantity', 'completed_quantity', 'warehouse_id',
    'planned_completion_date', 'actual_completion_date', 'start_date'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'work_orders',
      itemsTable: 'work_order_materials',
      headerFk: 'work_order_id',
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
    .from('work_orders')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Work Order', id, requestId);
  return c.json({ data });
});

manufacturing.delete('/work-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: wo, error: woErr } = await db
    .from('work_orders')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (woErr || !wo) throw ApiError.notFound('Work Order', id, requestId);
  if (!['draft', 'released'].includes(wo.status)) {
    throw ApiError.invalidState('Work Order', wo.status, 'delete', requestId,
      'Only draft or released work orders can be deleted');
  }

  await performSoftDelete(db, 'work_orders', id, user.organizationId, 'WorkOrder', requestId);
  return c.json({ data: { success: true } });
});

// ─── POST /work-orders/:id/issue-materials ──────────────────────────────────

manufacturing.post('/work-orders/:id/issue-materials', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // Validate work order exists, belongs to org, has correct status and warehouse
  const { data: wo, error: woError } = await db
    .from('work_orders')
    .select('id, status, warehouse_id, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (woError || !wo) throw ApiError.notFound('Work Order', id, requestId);

  if (wo.status !== 'released' && wo.status !== 'in_progress') {
    throw ApiError.invalidState('Work Order', wo.status, 'issue-materials', requestId);
  }

  if (!wo.warehouse_id) {
    throw ApiError.validation('Work order must have a warehouse assigned before issuing materials.', [], requestId);
  }

  // Atomic RPC: locks WO row, issues all materials, updates stock, transitions status
  const { data: result, error: rpcError } = await db.rpc('issue_work_order_materials', {
    p_work_order_id: id,
    p_organization_id: user.organizationId,
    p_warehouse_id: wo.warehouse_id,
    p_created_by: user.userId,
  });

  if (rpcError) {
    if (rpcError.message.includes('Insufficient stock') || rpcError.message.includes('stock_records_quantity_check')) {
      throw ApiError.validation('Insufficient stock to issue materials. Please check warehouse inventory.', [], requestId);
    }
    if (rpcError.message.includes('Invalid work order status')) {
      throw ApiError.invalidState('Work Order', wo.status, 'issue-materials', requestId);
    }
    throw ApiError.database(rpcError.message, requestId);
  }

  return c.json({ data: result ?? { success: true, issued_material_ids: [] } });
});

// ─── POST /work-orders/:id/complete ─────────────────────────────────────────

manufacturing.post('/work-orders/:id/complete', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get work order, validate status
  const { data: wo, error: woError } = await db
    .from('work_orders')
    .select('id, status, product_id, warehouse_id, completed_quantity')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (woError || !wo) throw ApiError.notFound('Work Order', id, requestId);

  if (wo.status !== 'in_progress') {
    throw ApiError.invalidState('Work Order', wo.status, 'complete', requestId);
  }

  // Guard: must have a positive completed_quantity before creating stock transaction
  if (!wo.completed_quantity || wo.completed_quantity <= 0) {
    throw ApiError.invalidState('Work Order', wo.status, 'complete (no completed quantity)', requestId);
  }

  // Guard: must have a warehouse assigned before completion
  if (!wo.warehouse_id) {
    throw ApiError.validation('Work order must have a warehouse assigned before completion.', [], requestId);
  }

  // 2. Atomic status transition FIRST: in_progress → completed (prevents duplicate stock-in)
  const { data, error } = await atomicStatusTransition(db, 'work_orders', id, user.organizationId,
    'in_progress', { status: 'completed', actual_completion_date: new Date().toISOString() },
    'id, work_order_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('Work Order', 'unknown', 'complete', requestId);

  // 3. Record finished goods stock-in (after confirming ownership of the transition)
  await createStockTransaction(db, {
    organizationId: user.organizationId,
    warehouseId: wo.warehouse_id,
    productId: wo.product_id,
    transactionType: 'in',
    qty: wo.completed_quantity,
    referenceType: 'work_order',
    referenceId: wo.id,
    createdBy: user.userId,
  }, requestId);

  return c.json({ data });
});

// ─── Work Order Productions ─────────────────────────────────────────────────

manufacturing.get('/work-order-productions', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('work_order_productions')
    .select(
      'id, work_order_id, production_date, quantity, qualified_quantity, defective_quantity, notes, created_at, work_order:work_orders!inner(id, work_order_number, organization_id, deleted_at)',
      { count: 'exact' }
    )
    .eq('work_order.organization_id', user.organizationId)
    .is('work_order.deleted_at', null);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

manufacturing.post('/work-order-productions', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Verify the work order belongs to the caller's org before inserting
  const { data: wo, error: woErr } = await db
    .from('work_orders')
    .select('id')
    .eq('id', body.work_order_id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (woErr || !wo) throw ApiError.notFound('WorkOrder', body.work_order_id, requestId);

  // Insert production record
  const PERMITTED_PRODUCTION = new Set(['work_order_id', 'production_date', 'quantity', 'qualified_quantity', 'defective_quantity', 'notes']);
  const insertData: Record<string, unknown> = { created_by: user.userId };
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED_PRODUCTION.has(k)) insertData[k] = v;
  }

  const { data, error } = await db
    .from('work_order_productions')
    .insert(insertData)
    .select('id, work_order_id, production_date, quantity, qualified_quantity, defective_quantity')
    .single();

  if (error) throw ApiError.database(error.message, requestId);

  // Atomically increment completed_quantity to avoid TOCTOU race
  if (data.work_order_id) {
    const { error: rpcErr } = await db.rpc('increment_completed_qty', {
      p_work_order_id: data.work_order_id,
      p_organization_id: user.organizationId,
      p_delta: data.qualified_quantity ?? 0,
    });
    if (rpcErr) throw ApiError.database(rpcErr.message, requestId);
  }

  return c.json({ data }, 201);
});

manufacturing.put('/work-order-productions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data: prod, error: prodErr } = await db
    .from('work_order_productions')
    .select('id, qualified_quantity, work_order:work_orders!inner(id, organization_id)')
    .eq('id', id)
    .eq('work_order.organization_id', user.organizationId)
    .single();
  if (prodErr || !prod) throw ApiError.notFound('WorkOrderProduction', id, requestId);

  const PERMITTED = new Set(['production_date', 'quantity', 'qualified_quantity', 'defective_quantity', 'notes']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }

  const { data, error } = await db
    .from('work_order_productions')
    .update(updateData)
    .eq('id', id)
    .eq('work_order_id', (prod.work_order as any).id)
    .select('id')
    .single();
  if (error) throw ApiError.database(error.message, requestId);

  if ('qualified_quantity' in updateData) {
    const oldQty = Number(prod.qualified_quantity) || 0;
    const newQty = Number(updateData.qualified_quantity) || 0;
    const delta = newQty - oldQty;
    if (delta !== 0) {
      const { error: rpcErr } = await db.rpc('increment_completed_qty', {
        p_work_order_id: (prod.work_order as any).id,
        p_organization_id: user.organizationId,
        p_delta: delta,
      });
      if (rpcErr) throw ApiError.database(rpcErr.message, requestId);
    }
  }

  return c.json({ data });
});

manufacturing.delete('/work-order-productions/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: prod, error: prodErr } = await db
    .from('work_order_productions')
    .select('id, qualified_quantity, work_order:work_orders!inner(id, organization_id)')
    .eq('id', id)
    .eq('work_order.organization_id', user.organizationId)
    .single();
  if (prodErr || !prod) throw ApiError.notFound('WorkOrderProduction', id, requestId);

  const { error } = await db
    .from('work_order_productions')
    .delete()
    .eq('id', id)
    .eq('work_order_id', (prod.work_order as any).id);
  if (error) throw ApiError.database(error.message, requestId);

  const qty = Number(prod.qualified_quantity) || 0;
  if (qty > 0) {
    const { error: rpcErr } = await db.rpc('increment_completed_qty', {
      p_work_order_id: (prod.work_order as any).id,
      p_organization_id: user.organizationId,
      p_delta: -qty,
    });
    if (rpcErr) throw ApiError.database(rpcErr.message, requestId);
  }

  return c.json({ data: { success: true } });
});

// ─── BOM Items ───────────────────────────────────────────────────────────────

manufacturing.route('', buildCrudRoutes({
  table: 'bom_items',
  path: '/bom-items',
  resourceName: 'BomItem',
  listSelect: 'id, quantity, unit, scrap_rate, sequence, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity, sequence',
  defaultSort: 'sequence',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'bom_header_id', parentTable: 'bom_headers' },
}));

// ─── Work Order Materials ────────────────────────────────────────────────────

manufacturing.route('', buildCrudRoutes({
  table: 'work_order_materials',
  path: '/work-order-materials',
  resourceName: 'WorkOrderMaterial',
  listSelect: 'id, required_quantity, issued_quantity, warehouse_id, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, required_quantity',
  defaultSort: 'id',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'work_order_id', parentTable: 'work_orders' },
}));

export default manufacturing;
