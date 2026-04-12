// src/routes/inventory.ts
// Inventory REST API

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { createAuthenticatedClient } from '../utils/supabase';

const inventory = new Hono<{ Bindings: Env }>();
inventory.use('*', authMiddleware());

function parseRefineQuery(c: any) {
  const page = parseInt(c.req.query('_page') ?? '1', 10);
  const pageSize = parseInt(c.req.query('_limit') ?? '20', 10);
  const sortField = c.req.query('_sort') ?? 'created_at';
  const sortOrder = (c.req.query('_order') ?? 'desc') as 'asc' | 'desc';
  return { page, pageSize, sortField, sortOrder };
}

inventory.get('/stock-records', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('stock_records')
    .select('id, qty_on_hand, qty_reserved, product:products(id,name,code), warehouse:warehouses(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  const result = (data ?? []).map((r: any) => ({ ...r, qty_available: r.qty_on_hand - r.qty_reserved }));
  return c.json({ data: result, total: count ?? 0, page, pageSize });
});

inventory.get('/warehouses', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('warehouses')
    .select('id, name, code, address, is_active', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

export default inventory;
