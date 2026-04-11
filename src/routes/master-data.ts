// src/routes/master-data.ts
// Master Data REST API

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { createAuthenticatedClient } from '../utils/supabase';

const masterData = new Hono<{ Bindings: Env }>();
masterData.use('*', authMiddleware());

function parseRefineQuery(c: any) {
  const page = parseInt(c.req.query('_page') ?? '1', 10);
  const pageSize = parseInt(c.req.query('_limit') ?? '20', 10);
  const sortField = c.req.query('_sort') ?? 'name';
  const sortOrder = (c.req.query('_order') ?? 'asc') as 'asc' | 'desc';
  return { page, pageSize, sort: [{ field: sortField, order: sortOrder }] };
}

masterData.get('/products', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('products')
    .select('id, name, code, description, category:product_categories(id,name), uom:uoms(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

masterData.get('/products/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { data, error } = await db
    .from('products')
    .select('*, category:product_categories(id,name), uom:uoms(id,name)')
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

masterData.post('/products', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('products')
    .insert({ ...body, organization_id: user.organizationId })
    .select('id, name, code').single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data }, 201);
});

masterData.put('/products/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('products')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .select('id').single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

masterData.delete('/products/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { error } = await db
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data: { success: true } });
});

export default masterData;
