// src/routes/contracts.ts
// Contracts REST API — Contract management with line items

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';

const contracts = new Hono<{ Bindings: Env }>();
contracts.use('*', authMiddleware());

// ─── Contracts ──────────────────────────────────────────────────────────────

contracts.get('/contracts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('contracts')
    .select('id, contract_number, title, party_type, contract_type, start_date, end_date, total_amount, currency, status, created_at', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

contracts.get('/contracts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('contracts')
    .select('*, items:contract_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Contract', id, requestId);
  return c.json({ data });
});

contracts.post('/contracts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { items, ...headerFields } = body;

  // Auto-generate contract_number
  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'contract',
  });
  if (seqError) throw ApiError.database(`Sequence generation failed: ${seqError.message}`, requestId);

  const result = await atomicCreateWithItems(db, {
    headerTable: 'contracts',
    itemsTable: 'contract_items',
    headerFk: 'contract_id',
    headerReturnSelect: 'id, contract_number, title',
    itemsReturnSelect: 'id, product_id, quantity, unit_price',
  }, {
    header: {
      ...headerFields,
      contract_number: num,
      organization_id: user.organizationId,
      created_by: user.userId,
    },
    items: items ?? [],
  });

  return c.json({ data: result }, 201);
});

contracts.put('/contracts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('contracts')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Contract', id, requestId);
  return c.json({ data });
});

contracts.delete('/contracts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('contracts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

export default contracts;
