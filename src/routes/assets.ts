// src/routes/assets.ts
// Asset Management REST API — Fixed Assets, Depreciation, Maintenance

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';

const assets = new Hono<{ Bindings: Env }>();
assets.use('*', authMiddleware());

// ─── Fixed Assets (full CRUD) ───────────────────────────────────────────────

assets.get('/fixed-assets', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('fixed_assets')
    .select('id, asset_number, name, category, acquisition_date, acquisition_cost, net_book_value, status, department_id, cost_center:cost_centers(id,name,code)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

assets.get('/fixed-assets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('fixed_assets')
    .select('*, cost_center:cost_centers(id,name,code), responsible_person:employees!responsible_person_id(id,name), depreciations:asset_depreciations(id,period_year,period_month,depreciation_amount,accumulated_amount,net_book_value), maintenance:asset_maintenance_records(id,maintenance_type,maintenance_date,cost,description)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Fixed Asset', id, requestId);
  return c.json({ data });
});

assets.post('/fixed-assets', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data, error } = await db
    .from('fixed_assets')
    .insert({
      ...body,
      organization_id: user.organizationId,
    })
    .select('id, asset_number, name')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

assets.put('/fixed-assets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('fixed_assets')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Fixed Asset', id, requestId);
  return c.json({ data });
});

assets.delete('/fixed-assets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('fixed_assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ─── Asset Depreciation Records (list + detail + create — immutable) ─────────
// Table: asset_depreciations — scoped via asset_id (no organization_id)

assets.get('/asset-depreciations', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('asset_depreciations')
    .select('id, period_year, period_month, depreciation_amount, accumulated_amount, net_book_value, fixed_asset:fixed_assets(id,asset_number,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

assets.get('/asset-depreciations/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('asset_depreciations')
    .select('*, fixed_asset:fixed_assets(id,asset_number,name)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (error) throw ApiError.notFound('Asset Depreciation', id, requestId);
  return c.json({ data });
});

assets.post('/asset-depreciations', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data, error } = await db
    .from('asset_depreciations')
    .insert({ ...body, organization_id: user.organizationId })
    .select('id, period_year, period_month, depreciation_amount, accumulated_amount, net_book_value')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// ─── Asset Maintenance Records (full CRUD) ──────────────────────────────────
// Columns: id, fixed_asset_id, maintenance_type, description, cost, performed_by, maintenance_date, next_maintenance_date

assets.route('', buildCrudRoutes({
  table: 'asset_maintenance_records',
  path: '/asset-maintenance',
  resourceName: 'Asset Maintenance Record',
  listSelect: 'id, maintenance_type, description, cost, performed_by, maintenance_date, next_maintenance_date',
  detailSelect: '*',
  createReturnSelect: 'id, maintenance_type, maintenance_date',
  defaultSort: 'maintenance_date',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'fixed_asset_id', parentTable: 'fixed_assets' },
}));

export default assets;
