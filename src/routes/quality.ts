// src/routes/quality.ts
// Quality Management REST API — Defect Codes, Standards, Inspections

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';

const quality = new Hono<{ Bindings: Env }>();
quality.use('*', authMiddleware());

// ─── Defect Codes (full CRUD via factory) ───────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'defect_codes',
  path: '/defect-codes',
  resourceName: 'Defect Code',
  listSelect: 'id, code, name, category, severity, is_active',
  detailSelect: '*',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
}));

// ─── Quality Standards ──────────────────────────────────────────────────────

quality.get('/quality-standards', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('quality_standards')
    .select('id, standard_code, standard_name, is_active, description, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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

quality.post('/quality-standards', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...headerFields } = body;

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
      created_by: user.userId,
    },
    items: items ?? [],
  });

  return c.json({ data: result }, 201);
});

quality.put('/quality-standards/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const allowed: Record<string, unknown> = {};
  const permitted = ['name', 'product_id', 'product_category_id', 'applicable_to',
    'version', 'is_active'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('quality_standards')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Quality Standard', id, requestId);
  return c.json({ data });
});

quality.delete('/quality-standards/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('quality_standards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ─── Quality Inspections ────────────────────────────────────────────────────

quality.get('/quality-inspections', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('quality_inspections')
    .select('id, inspection_number, inspection_date, reference_type, total_quantity, qualified_quantity, defective_quantity, result, status, inspector_id, product:products(id,name,code)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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
    .select('*, items:quality_inspection_items(*, defect_code:defect_codes(id,code,name))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Quality Inspection', id, requestId);
  return c.json({ data });
});

quality.post('/quality-inspections', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...headerFields } = body;

  // Auto-generate inspection_number
  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'quality_inspection',
  });
  if (seqError) throw ApiError.database(`Sequence generation failed: ${seqError.message}`, requestId);

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
    },
    items: items ?? [],
  });

  return c.json({ data: result }, 201);
});

quality.put('/quality-inspections/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const allowed: Record<string, unknown> = {};
  const permitted = ['status', 'notes', 'result', 'qualified_qty', 'defective_qty',
    'sample_qty', 'inspector_id', 'defect_code_id', 'completed_at', 'inspection_date'];
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('quality_inspections')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Quality Inspection', id, requestId);
  return c.json({ data });
});

quality.delete('/quality-inspections/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('quality_inspections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ─── Quality Standard Items ─────────────────────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'quality_standard_items',
  path: '/quality-standard-items',
  resourceName: 'QualityStandardItem',
  listSelect: 'id, sequence_order, item_name, check_method, acceptance_criteria, is_mandatory',
  detailSelect: '*',
  createReturnSelect: 'id, sequence_order, item_name',
  defaultSort: 'sequence_order',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'quality_standard_id', parentTable: 'quality_standards' },
}));

// ─── Quality Inspection Items ───────────────────────────────────────────────

quality.route('', buildCrudRoutes({
  table: 'quality_inspection_items',
  path: '/quality-inspection-items',
  resourceName: 'QualityInspectionItem',
  listSelect: 'id, check_item, check_standard, measured_value, check_result, notes',
  detailSelect: '*',
  createReturnSelect: 'id, check_item, check_result',
  defaultSort: 'id',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'inspection_id', parentTable: 'quality_inspections' },
}));

export default quality;
