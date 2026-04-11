// src/routes/sales.ts
// Sales REST API — Refine DataProvider compatible

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { createAuthenticatedClient } from '../utils/supabase';

const sales = new Hono<{ Bindings: Env }>();
sales.use('*', authMiddleware());

function parseRefineQuery(c: any) {
  const page = parseInt(c.req.query('_page') ?? '1', 10);
  const pageSize = parseInt(c.req.query('_limit') ?? '20', 10);
  const sortField = c.req.query('_sort') ?? 'created_at';
  const sortOrder = (c.req.query('_order') ?? 'desc') as 'asc' | 'desc';
  return { page, pageSize, sort: [{ field: sortField, order: sortOrder }] };
}

// Sales Orders
sales.get('/sales-orders', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_orders')
    .select('id, order_number, status, order_date, total_amount, currency, customer:customers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

sales.get('/sales-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { data, error } = await db
    .from('sales_orders')
    .select('*, customer:customers(id,name,code), items:sales_order_items(*, product:products(id,name,code))')
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json({ data });
});

sales.post('/sales-orders', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('sales_orders')
    .insert({ ...body, organization_id: user.organizationId })
    .select('id, order_number').single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data }, 201);
});

sales.put('/sales-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const body = await c.req.json();

  const { data, error } = await db
    .from('sales_orders')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId)
    .select('id').single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

sales.delete('/sales-orders/:id', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const { error } = await db
    .from('sales_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .eq('organization_id', user.organizationId);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data: { success: true } });
});

// Customers
sales.get('/customers', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('customers')
    .select('id, name, code, email, phone, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// Sales Invoices
sales.get('/sales-invoices', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_invoices')
    .select('id, invoice_number, status, invoice_date, total_amount, currency, customer:customers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

export default sales;
