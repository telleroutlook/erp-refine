// src/routes/manufacturing.ts
// Manufacturing REST API — BOM, Work Orders, Production Reporting

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { batchCreateStockTransactions, createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';

const manufacturing = new Hono<{ Bindings: Env }>();
manufacturing.use('*', authMiddleware());

// ─── BOM Headers ────────────────────────────────────────────────────────────

manufacturing.get('/bom-headers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('bom_headers')
    .select('id, bom_number, version, is_active, effective_date, product:products(id,name,code), created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
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
  });

  return c.json({ data: result.header }, 201);
});

manufacturing.put('/bom-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const allowed: Record<string, unknown> = {};
  const permitted = ['notes', 'quantity', 'effective_date', 'is_active', 'version'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('bom_headers')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('BOM', id, requestId);
  return c.json({ data });
});

manufacturing.delete('/bom-headers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('bom_headers')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ─── Work Orders ────────────────────────────────────────────────────────────

manufacturing.get('/work-orders', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('work_orders')
    .select('id, work_order_number, planned_quantity, completed_quantity, status, start_date, planned_completion_date, product:products(id,name,code), bom:bom_headers(id,bom_number), created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
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
      .eq('bom_header_id', body.bom_header_id);

    if (bomError) throw ApiError.database(`Failed to fetch BOM items: ${bomError.message}`, requestId);
    bomItems = bom ?? [];
  }

  // Insert work order header
  const { items: _discardedItems, ...headerFields } = body;
  const { data: wo, error: woError } = await db
    .from('work_orders')
    .insert({
      ...headerFields,
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
      required_quantity: item.quantity * (body.planned_quantity ?? 1),
      issued_quantity: 0,
      warehouse_id: body.warehouse_id,
    }));

    const { error: matError } = await db
      .from('work_order_materials')
      .insert(materials);

    if (matError) {
      // Rollback: delete work order
      await db.from('work_orders').delete().eq('id', wo.id);
      throw ApiError.database(`Failed to create work order materials: ${matError.message}`, requestId);
    }
  }

  return c.json({ data: wo }, 201);
});

manufacturing.put('/work-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const allowed: Record<string, unknown> = {};
  const permitted = ['status', 'notes', 'planned_quantity', 'warehouse_id',
    'planned_completion_date', 'actual_completion_date', 'start_date'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('work_orders')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Work Order', id, requestId);
  return c.json({ data });
});

manufacturing.delete('/work-orders/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('work_orders')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ─── POST /work-orders/:id/issue-materials ──────────────────────────────────

manufacturing.post('/work-orders/:id/issue-materials', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get work order with materials, validate status
  const { data: wo, error: woError } = await db
    .from('work_orders')
    .select('id, status, warehouse_id, organization_id, materials:work_order_materials(id, product_id, required_quantity, issued_quantity)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (woError || !wo) throw ApiError.notFound('Work Order', id, requestId);

  if (wo.status !== 'released' && wo.status !== 'in_progress') {
    throw ApiError.invalidState('Work Order', wo.status, 'issue-materials', requestId);
  }

  const materials = (wo.materials ?? []) as any[];
  const issuedMaterials: string[] = [];

  // 2. Build batch arrays — compute issue quantities up-front
  const stockTxInputs: Parameters<typeof batchCreateStockTransactions>[1] = [];
  const materialUpdates: Array<{ id: string; newIssuedQty: number }> = [];

  for (const mat of materials as Record<string, unknown>[]) {
    const issueQty = (mat.required_quantity as number) - (mat.issued_quantity as number);
    if (issueQty <= 0) continue;

    stockTxInputs.push({
      organizationId: user.organizationId,
      warehouseId: wo.warehouse_id,
      productId: mat.product_id as string,
      transactionType: 'out',
      qty: issueQty,
      referenceType: 'production',
      referenceId: wo.id,
      createdBy: user.userId,
    });

    materialUpdates.push({
      id: mat.id as string,
      newIssuedQty: (mat.issued_quantity as number) + issueQty,
    });

    issuedMaterials.push(mat.id as string);
  }

  // Single batch insert for all stock transactions
  await batchCreateStockTransactions(db, stockTxInputs, requestId);

  // Batch update work_order_materials — one request per row (Supabase lacks multi-row UPDATE)
  await Promise.all(
    materialUpdates.map(({ id, newIssuedQty }) =>
      db.from('work_order_materials').update({ issued_quantity: newIssuedQty }).eq('id', id)
    )
  );

  // 3. Update work order status to 'in_progress' if not already
  if (wo.status !== 'in_progress') {
    await db
      .from('work_orders')
      .update({ status: 'in_progress' })
      .eq('id', wo.id)
      .eq('organization_id', user.organizationId);
  }

  return c.json({ data: { success: true, issued_material_ids: issuedMaterials } });
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
    .single();

  if (woError || !wo) throw ApiError.notFound('Work Order', id, requestId);

  if (wo.status !== 'in_progress') {
    throw ApiError.invalidState('Work Order', wo.status, 'complete', requestId);
  }

  // Guard: must have a positive completed_quantity before creating stock transaction
  if (!wo.completed_quantity || wo.completed_quantity <= 0) {
    throw ApiError.invalidState('Work Order', wo.status, 'complete (no completed quantity)', requestId);
  }

  // 2. Record finished goods stock-in (trigger updates stock_records)
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

  // 4. Update work order: status='completed', actual_completion_date=NOW()
  const { error: updateError } = await db
    .from('work_orders')
    .update({
      status: 'completed',
      actual_completion_date: new Date().toISOString(),
    })
    .eq('id', wo.id)
    .eq('organization_id', user.organizationId);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({ data: { success: true, id: wo.id, status: 'completed' } });
});

// ─── Work Order Productions ─────────────────────────────────────────────────

manufacturing.get('/work-order-productions', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('work_order_productions')
    .select(
      'id, work_order_id, production_date, quantity, qualified_quantity, defective_quantity, notes, created_at, work_order:work_orders!inner(id, work_order_number, organization_id)',
      { count: 'exact' }
    )
    .eq('work_order.organization_id', user.organizationId)
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

  // Update parent work order's completed_qty via aggregate
  if (data.work_order_id) {
    const { data: sumRow } = await db
      .from('work_order_productions')
      .select('total:qualified_quantity.sum()')
      .eq('work_order_id', data.work_order_id)
      .single();
    await db
      .from('work_orders')
      .update({ completed_quantity: (sumRow as any)?.total ?? 0 })
      .eq('id', data.work_order_id)
      .eq('organization_id', user.organizationId);
  }

  return c.json({ data }, 201);
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
