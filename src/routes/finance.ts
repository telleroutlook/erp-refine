// src/routes/finance.ts
// Finance REST API

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { createAuthenticatedClient } from '../utils/supabase';

const finance = new Hono<{ Bindings: Env }>();
finance.use('*', authMiddleware());

function parseRefineQuery(c: any) {
  const page = parseInt(c.req.query('_page') ?? '1', 10);
  const pageSize = parseInt(c.req.query('_limit') ?? '20', 10);
  const sortField = c.req.query('_sort') ?? 'created_at';
  const sortOrder = (c.req.query('_order') ?? 'desc') as 'asc' | 'desc';
  return { page, pageSize, sort: [{ field: sortField, order: sortOrder }] };
}

finance.get('/vouchers', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('vouchers')
    .select('id, voucher_number, voucher_date, description, total_debit, total_credit, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

finance.get('/payment-requests', async (c) => {
  const user = c.get('user');
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const { page, pageSize, sort } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('payment_requests')
    .select('id, request_number, amount, currency, due_date, ok_to_pay, status, supplier:suppliers(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sort[0].field, { ascending: sort[0].order === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

export default finance;
