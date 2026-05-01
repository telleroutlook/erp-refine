// src/routes/quality.ts
// Quality Management REST API — Defect Codes, Standards, Inspections

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, resolveEmployeeId } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';
import { createStockTransaction } from '../utils/stock-helpers';
import { defect_codes, quality_standard_items, quality_inspection_items } from '../schema/columns';

const quality = new Hono<{ Bindings: Env }>();
quality.use('*', authMiddleware());
quality.use('*', writeMethodGuard());

// ─── Defect Codes (full CRUD via factory) ───────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'defect_codes',
  path: '/defect-codes',
  resourceName: 'Defect Code',
  listSelect: 'id, code, name, category, severity, is_active',
  detailSelect: defect_codes.join(', '),
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
}));

// ─── Quality Standards ──────────────────────────────────────────────────────

quality.get('/quality-standards', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('quality_standards')
    .select('id, standard_code, standard_name, is_active, description, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

quality.get('/quality-standards/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('quality_standards')
    .select('*, items:quality_standard_items(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Quality Standard', id, requestId);
  return c.json({ data });
});

const PERMITTED_QUALITY_STANDARD = new Set([
  'standard_code', 'standard_name', 'description', 'is_active',
]);

quality.post('/quality-standards', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...rawFields } = body;

  const headerFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawFields)) {
    if (PERMITTED_QUALITY_STANDARD.has(k)) headerFields[k] = v;
  }

  const result = await atomicCreateWithItems(db, {
    headerTable: 'quality_standards',
    itemsTable: 'quality_standard_items',
    headerFk: 'standard_id',
    headerReturnSelect: 'id, standard_code, standard_name',
    itemsReturnSelect: 'id',
  }, {
    header: {
      ...headerFields,
      organization_id: user.organizationId,
    },
    items: items ?? [],
  });

  return c.json({ data: result.header }, 201);
});

quality.put('/quality-standards/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['standard_name', 'standard_code', 'description', 'is_active'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'quality_standards',
      itemsTable: 'quality_standard_items',
      headerFk: 'standard_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: 'id, sequence_order, item_name, check_method, acceptance_criteria, is_mandatory',
      headerReturnSelect: 'id',
      softDeleteItems: true,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('quality_standards')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Quality Standard', id, requestId);
  return c.json({ data });
});

quality.delete('/quality-standards/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'quality_standards', c.req.param('id'), user.organizationId, 'QualityStandard', requestId);
  return c.json({ data: { success: true } });
});

// ─── Quality Inspections ────────────────────────────────────────────────────

quality.get('/quality-inspections', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('quality_inspections')
    .select('id, inspection_number, inspection_date, reference_type, total_quantity, qualified_quantity, defective_quantity, result, status, inspector_id, product:products(id,name,code)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

quality.get('/quality-inspections/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('quality_inspections')
    .select('*, product:products(id,name,code), inspector:employees!inspector_id(id,name,employee_number), items:quality_inspection_items(*, defect_code:defect_codes(id,code,name))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Quality Inspection', id, requestId);
  return c.json({ data });
});

const PERMITTED_QUALITY_INSPECTION = new Set([
  'inspection_date', 'reference_type', 'reference_id', 'product_id',
  'total_quantity', 'qualified_quantity', 'defective_quantity',
  'result', 'notes', 'inspector_id', 'warehouse_id',
]);

quality.post('/quality-inspections', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...rawFields } = body;

  const headerFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawFields)) {
    if (PERMITTED_QUALITY_INSPECTION.has(k)) headerFields[k] = v;
  }

  // Auto-generate inspection_number
  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'quality_inspection',
  });
  if (seqError || !num) throw ApiError.database(`Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
  const result = await atomicCreateWithItems(db, {
    headerTable: 'quality_inspections',
    itemsTable: 'quality_inspection_items',
    headerFk: 'quality_inspection_id',
    headerReturnSelect: 'id, inspection_number',
    itemsReturnSelect: 'id',
  }, {
    header: {
      ...headerFields,
      inspection_number: num,
      organization_id: user.organizationId,
      created_by: empId,
    },
    items: items ?? [],
  });

  return c.json({ data: result.header }, 201);
});

quality.put('/quality-inspections/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['notes', 'result', 'qualified_quantity', 'defective_quantity',
    'inspector_id', 'inspection_date', 'total_quantity'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'quality_inspections',
      itemsTable: 'quality_inspection_items',
      headerFk: 'quality_inspection_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: 'id, check_item, check_standard, measured_value, check_result, notes',
      headerReturnSelect: 'id',
      softDeleteItems: false,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('quality_inspections')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Quality Inspection', id, requestId);
  return c.json({ data });
});

quality.delete('/quality-inspections/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'quality_inspections', c.req.param('id'), user.organizationId, 'QualityInspection', requestId);
  return c.json({ data: { success: true } });
});

// ─── Quality Inspection Workflow — complete ─────────────────────────────────

// POST /quality-inspections/:id/complete — draft/in_progress → completed
// On pass/conditional for purchase_receipt inspections: creates stock-in + updates PO received_qty
quality.post('/quality-inspections/:id/complete', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  // 1. Fetch QI with receipt item link (need it for post-completion logic)
  const { data: qi, error: qiError } = await db
    .from('quality_inspections')
    .select('id, inspection_number, reference_type, reference_id, product_id, purchase_receipt_item_id, total_quantity, qualified_quantity, defective_quantity, result, status')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (qiError || !qi) throw ApiError.notFound('QualityInspection', id, requestId);

  const result = body.result ?? qi.result;
  if (!result || result === 'pending') {
    throw ApiError.badRequest('Inspection result (pass/fail/conditional) is required to complete', requestId);
  }

  const qualifiedQty = Number(body.qualified_quantity ?? qi.qualified_quantity ?? 0);
  const defectiveQty = Number(body.defective_quantity ?? qi.defective_quantity ?? 0);

  const updatePayload: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    completed_by: user.userId,
    result,
    qualified_quantity: qualifiedQty,
    defective_quantity: defectiveQty,
  };

  // 2. Atomic status transition
  const { data, error } = await atomicStatusTransition(db, 'quality_inspections', id, user.organizationId,
    ['draft', 'in_progress'], updatePayload, 'id, inspection_number, status, result');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('QualityInspection', 'unknown', 'complete', requestId);

  // 3. Post-completion: stock-in + PO update for purchase_receipt inspections
  if (qi.reference_type === 'purchase_receipt' && (result === 'pass' || result === 'conditional') && qualifiedQty > 0) {
    const { data: receipt } = await db
      .from('purchase_receipts')
      .select('warehouse_id')
      .eq('id', qi.reference_id)
      .eq('organization_id', user.organizationId)
      .single();

    if (receipt?.warehouse_id) {
      await createStockTransaction(db, {
        organizationId: user.organizationId,
        warehouseId: receipt.warehouse_id,
        productId: qi.product_id,
        transactionType: 'in',
        qty: qualifiedQty,
        referenceType: 'purchase_receipt',
        referenceId: qi.reference_id,
        notes: `QI ${qi.inspection_number} ${result}: ${qualifiedQty} qualified`,
        createdBy: user.userId,
      }, requestId);

      // Update PO received_quantity via receipt item link
      if (qi.purchase_receipt_item_id) {
        const { data: receiptItem } = await db
          .from('purchase_receipt_items')
          .select('purchase_order_item_id')
          .eq('id', qi.purchase_receipt_item_id)
          .single();

        if (receiptItem?.purchase_order_item_id) {
          await db.rpc('increment_po_received_qty', {
            p_poi_id: receiptItem.purchase_order_item_id,
            p_qty: qualifiedQty,
          });
        }
      }
    }
  }

  return c.json({ data });
});

// ─── Quality Standard Items ─────────────────────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'quality_standard_items',
  path: '/quality-standard-items',
  resourceName: 'QualityStandardItem',
  listSelect: 'id, sequence_order, item_name, check_method, acceptance_criteria, is_mandatory',
  detailSelect: quality_standard_items.join(', '),
  createReturnSelect: 'id, sequence_order, item_name',
  defaultSort: 'sequence_order',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'standard_id', parentTable: 'quality_standards' },
}));

// ─── Quality Inspection Items ───────────────────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'quality_inspection_items',
  path: '/quality-inspection-items',
  resourceName: 'QualityInspectionItem',
  listSelect: 'id, check_item, check_standard, measured_value, check_result, notes',
  detailSelect: quality_inspection_items.join(', '),
  createReturnSelect: 'id, check_item, check_result',
  defaultSort: 'id',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'quality_inspection_id', parentTable: 'quality_inspections' },
}));

export default quality;
