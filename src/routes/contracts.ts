// src/routes/contracts.ts
// Contracts REST API — Contract management with line items

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';

const contracts = new Hono<{ Bindings: Env }>();
contracts.use('*', authMiddleware());
contracts.use('*', writeMethodGuard());

// ─── Contracts ──────────────────────────────────────────────────────────────

contracts.get('/contracts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'contract_items' };

  const baseSelect = 'id, contract_number, party_type, contract_type, start_date, end_date, total_amount, currency, status, created_at';
  let query = db
    .from('contracts')
    .select(buildSelectWithItemFilter(baseSelect, itemJoin, itemFilters), { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  query = applyItemFilters(query, itemJoin, itemFilters);

  const { data, count, error } = await query
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
  if (seqError || !num) throw ApiError.database(`Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const result = await atomicCreateWithItems(db, {
    headerTable: 'contracts',
    itemsTable: 'contract_items',
    headerFk: 'contract_id',
    headerReturnSelect: 'id, contract_number',
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

  return c.json({ data: result.header }, 201);
});

contracts.put('/contracts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['start_date', 'end_date', 'total_amount', 'currency',
    'payment_terms', 'status', 'notes', 'contract_type'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'contracts',
      itemsTable: 'contract_items',
      headerFk: 'contract_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      softDeleteItems: true,
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('contracts')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Contract', id, requestId);
  return c.json({ data });
});

contracts.delete('/contracts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'contracts', c.req.param('id'), user.organizationId, 'Contract', requestId);
  return c.json({ data: { success: true } });
});

// ─── Contract Workflow Actions ──────────────────────────────────────────────

// POST /contracts/:id/activate — draft → active
contracts.post('/contracts/:id/activate', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await atomicStatusTransition(db, 'contracts', id, user.organizationId,
    'draft', { status: 'active', activated_at: new Date().toISOString(), activated_by: user.userId },
    'id, contract_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('Contract', 'unknown', 'activate', requestId);
  return c.json({ data });
});

// POST /contracts/:id/terminate — active → terminated
contracts.post('/contracts/:id/terminate', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const { data, error } = await atomicStatusTransition(db, 'contracts', id, user.organizationId,
    'active', {
      status: 'terminated',
      terminated_at: new Date().toISOString(),
      terminated_by: user.userId,
      termination_reason: body.reason ?? null,
    }, 'id, contract_number, status');
  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('Contract', 'unknown', 'terminate', requestId);
  return c.json({ data });
});

// POST /contracts/:id/renew — active → create new contract from existing
contracts.post('/contracts/:id/renew', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const { data: original, error: fetchError } = await db
    .from('contracts')
    .select('*, items:contract_items(product_id, quantity, unit_price, tax_rate, notes, deleted_at)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !original) throw ApiError.notFound('Contract', id, requestId);
  if (original.status !== 'active' && original.status !== 'expired') {
    throw ApiError.invalidState('Contract', original.status, 'renew', requestId);
  }

  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'contract',
  });
  if (seqError || !seqData) throw ApiError.database(`Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const result = await atomicCreateWithItems(db, {
    headerTable: 'contracts',
    itemsTable: 'contract_items',
    headerFk: 'contract_id',
    headerReturnSelect: 'id, contract_number, status',
    itemsReturnSelect: 'id, product_id, quantity, unit_price',
  }, {
    header: {
      contract_number: seqData,
      organization_id: user.organizationId,
      party_type: original.party_type,
      party_id: original.party_id,
      contract_type: original.contract_type,
      start_date: body.start_date ?? original.end_date,
      end_date: body.end_date ?? null,
      total_amount: original.total_amount,
      currency: original.currency,
      payment_terms: original.payment_terms,
      notes: body.notes ?? `Renewed from ${original.contract_number}`,
      status: 'draft',
      created_by: user.userId,
      renewed_from_id: original.id,
    },
    items: (original.items ?? []).filter((i: any) => !i.deleted_at),
  });

  return c.json({ data: result.header }, 201);
});

// ─── Contract Items ──────────────────────────────────────────────────────────

contracts.route('', buildCrudRoutes({
  table: 'contract_items',
  path: '/contract-items',
  resourceName: 'ContractItem',
  listSelect: 'id, quantity, unit_price, tax_rate, amount, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity, unit_price',
  defaultSort: 'id',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'contract_id', parentTable: 'contracts' },
}));

export default contracts;
