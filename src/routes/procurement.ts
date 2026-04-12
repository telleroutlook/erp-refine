// src/routes/procurement.ts
// Procurement REST API — Refine DataProvider compatible

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { createAuthenticatedClient } from '../utils/supabase';
import { applyFilters, applyPagination } from '../utils/database';

const procurement = new Hono<{ Bindings: Env }>();
procurement.use('*', authMiddleware());

// Helper: parse Refine query params
function parseRefineQuery(c: any) {
  const page = parseInt(c.req.query('_page') ?? '1', 10);
  const pageSize = parseInt(c.req.query('_limit') ?? '20', 10);
  const sortField = c.req.query('_sort') ?? 'created_at';
  const sortOrder = (c.req.query('_order') ?? 'desc') as 'asc' | 'desc';
  return { page, pageSize, sortField, sortOrder };
}

// --- Purchase Orders ---
procurement.get('/purchase-orders', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('purchase_orders')
    .select('id, order_number, status, order_date, total_amount, currency, supplier:suppliers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

procurement.get('/purchase-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { data, error } = await db
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,code,email), items:purchase_order_items(*, product:products(id,name,code))')
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

procurement.post('/purchase-orders', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('purchase_orders')
    .insert({ ...body, organization_id: user.organizationId })
    .select('id, order_number')
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data }, 201);
});

procurement.put('/purchase-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('purchase_orders')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

procurement.delete('/purchase-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { error } = await db
    .from('purchase_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data: { success: true } });
});

// --- Suppliers ---
procurement.get('/suppliers', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('suppliers')
    .select('id, name, code, email, phone, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

export default procurement;
