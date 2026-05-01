// src/routes/finance.ts
// Finance REST API — Account subjects, cost centers, vouchers, budgets, payments

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, atomicStatusTransition, buildSelectWithItemFilter, applyItemFilters } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';
import { createDocumentRelation } from '../utils/create-from-helpers';
import { payment_records } from '../schema/columns';

const finance = new Hono<{ Bindings: Env }>();
finance.use('*', authMiddleware());
finance.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Account Subjects — tree structure, full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const accountSubjectsConfig: CrudConfig = {
  table: 'account_subjects',
  path: '/account-subjects',
  resourceName: 'AccountSubject',
  listSelect: 'id, code, name, category, balance_direction, parent_id, is_leaf, status',
  detailSelect: '*, parent:account_subjects(id,code,name)',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: false,
  orgScoped: true,
};
finance.route('', buildCrudRoutes(accountSubjectsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Cost Centers — tree structure, full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const costCentersConfig: CrudConfig = {
  table: 'cost_centers',
  path: '/cost-centers',
  resourceName: 'CostCenter',
  listSelect: 'id, code, name, parent_id, manager_id, is_active',
  detailSelect: '*, parent:cost_centers(id,code,name)',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
};
finance.route('', buildCrudRoutes(costCentersConfig));

// ────────────────────────────────────────────────────────────────────────────
// Vouchers — custom CRUD with atomic create (header + entries)
// ────────────────────────────────────────────────────────────────────────────

// GET list
finance.get('/vouchers', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'voucher_entries' };

  const baseSelect = 'id, voucher_number, voucher_date, voucher_type, notes, total_debit, total_credit, status';
  let query = db
    .from('vouchers')
    .select(buildSelectWithItemFilter(baseSelect, itemJoin, itemFilters), { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);
  query = applyItemFilters(query, itemJoin, itemFilters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list Vouchers. Check sort field '${sortField}' exists.`);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail (with entries)
finance.get('/vouchers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('vouchers')
    .select('*, entries:voucher_entries(*, account:account_subjects(id,code,name))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Voucher', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + entries, with debit/credit validation)
finance.post('/vouchers', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Validate: total debit must equal total credit
  const entries: Array<{ entry_type: string; amount: number }> = body.entries ?? [];
  if (entries.length === 0) {
    throw ApiError.validation('Voucher must have at least one entry.', [], requestId);
  }

  const totalDebit = entries
    .filter((e) => e.entry_type === 'debit')
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const totalCredit = entries
    .filter((e) => e.entry_type === 'credit')
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw ApiError.validation(
      `Debit total (${totalDebit}) must equal credit total (${totalCredit}).`,
      [
        { field: 'entries', code: 'debit_credit_mismatch', message: `Debit sum=${totalDebit}, Credit sum=${totalCredit}. Difference=${Math.abs(totalDebit - totalCredit).toFixed(2)}` },
      ],
      requestId,
      'Adjust entry amounts so that total debits equal total credits.'
    );
  }

  // Auto-generate voucher_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'voucher',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate voucher number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { entries: entryItems, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'vouchers',
      itemsTable: 'voucher_entries',
      headerFk: 'voucher_id',
      headerReturnSelect: 'id, voucher_number, status, total_debit, total_credit',
      itemsReturnSelect: 'id, account_subject_id, entry_type, amount, sequence',
    },
    {
      header: {
        ...headerFields,
        voucher_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by: user.userId,
      },
      items: entryItems ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_voucher',
      resource: 'vouchers',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
finance.put('/vouchers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  // Posted vouchers cannot be updated — must be reversed first
  const { data: existing, error: fetchErr } = await db
    .from('vouchers')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();
  if (fetchErr || !existing) throw ApiError.notFound('Voucher', id, requestId);
  if (existing.status === 'posted') throw ApiError.invalidState('Voucher', 'posted', 'update', requestId);

  const permitted = ['voucher_date', 'voucher_type', 'notes',
    'approved_by', 'approved_at'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'vouchers',
      itemsTable: 'voucher_entries',
      headerFk: 'voucher_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: '*, account:account_subjects(id,code,name)',
      headerReturnSelect: 'id',
      softDeleteItems: false,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);

    // Recalculate total_debit/total_credit from entries
    const { data: entries } = await db
      .from('voucher_entries')
      .select('entry_type, amount')
      .eq('voucher_id', id);
    const totalDebit = (entries ?? []).filter((e: any) => e.entry_type === 'debit').reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalCredit = (entries ?? []).filter((e: any) => e.entry_type === 'credit').reduce((s: number, e: any) => s + Number(e.amount), 0);
    await db.from('vouchers').update({ total_debit: totalDebit, total_credit: totalCredit })
      .eq('id', id).eq('organization_id', user.organizationId);

    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('vouchers')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .neq('status', 'posted')
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Voucher', id, requestId);
  return c.json({ data });
});

// DELETE (hard delete — vouchers has no deleted_at; only draft vouchers can be deleted)
finance.delete('/vouchers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: voucher, error: fetchError } = await db
    .from('vouchers')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (fetchError || !voucher) throw ApiError.notFound('Voucher', id, requestId);
  if (voucher.status !== 'draft') {
    throw ApiError.validation('Only draft vouchers can be deleted. Use void/reverse for posted vouchers.', [], requestId);
  }

  const { error } = await db
    .from('vouchers')
    .delete()
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /vouchers/:id/post — post voucher (validate debit == credit)
// ────────────────────────────────────────────────────────────────────────────

finance.post('/vouchers/:id/post', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Read-only precondition: validate debit == credit
  const { data: voucher, error: fetchError } = await db
    .from('vouchers')
    .select('total_debit, total_credit')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (fetchError || !voucher) throw ApiError.notFound('Voucher', id, requestId);

  if (Math.abs((voucher.total_debit ?? 0) - (voucher.total_credit ?? 0)) > 0.01) {
    throw ApiError.validation(
      `Cannot post voucher: debit (${voucher.total_debit}) does not equal credit (${voucher.total_credit}).`,
      [],
      requestId,
      'Update voucher entries so debits equal credits before posting.'
    );
  }

  // 2. Atomic status transition: draft → posted
  const { data, error } = await atomicStatusTransition(db, 'vouchers', id, user.organizationId, 'draft', {
    status: 'posted',
    posted_at: new Date().toISOString(),
  }, 'id, voucher_number, status');

  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('Voucher', 'unknown', 'post', requestId);

  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /vouchers/:id/void — posted → voided (creates reversing entry)
// ────────────────────────────────────────────────────────────────────────────

finance.post('/vouchers/:id/void', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const { data, error } = await atomicStatusTransition(db, 'vouchers', id, user.organizationId, 'posted', {
    status: 'voided',
    voided_at: new Date().toISOString(),
    voided_by: user.userId,
    void_reason: body.reason ?? null,
  }, 'id, voucher_number, status');

  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('Voucher', 'unknown', 'void', requestId);

  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// Budgets — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
finance.get('/budgets', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('budgets')
    .select(
      'id, budget_name, budget_year, total_amount, currency, status',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null);
  query = applyFilters(query, filters);

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
finance.get('/budgets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('budgets')
    .select('*, lines:budget_lines(*, cost_center:cost_centers(id,code,name))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Budget', id, requestId);
  return c.json({ data });
});

// POST create (atomic: header + lines)
finance.post('/budgets', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { lines, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'budgets',
      itemsTable: 'budget_lines',
      headerFk: 'budget_id',
      headerReturnSelect: 'id, budget_name, status',
      itemsReturnSelect: 'id, account_code, planned_amount',
    },
    {
      header: {
        ...headerFields,
        organization_id: user.organizationId,
        status: 'draft',
      },
      items: lines ?? [],
    },
    {
      userId: user.userId,
      organizationId: user.organizationId,
      requestId,
      action: 'create_budget',
      resource: 'budgets',
    }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
finance.put('/budgets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const permitted = ['budget_name', 'budget_year', 'total_amount', 'currency', 'status',
    'approved_by', 'approved_at'];

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'budgets',
      itemsTable: 'budget_lines',
      headerFk: 'budget_id',
      headerPermittedFields: permitted,
      itemsReturnSelect: '*, cost_center:cost_centers(id,code,name)',
      headerReturnSelect: 'id',
      softDeleteItems: true,
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.planned_amount) || 0 },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of permitted) if (body[k] !== undefined) allowed[k] = body[k];

  const { data, error } = await db
    .from('budgets')
    .update(allowed)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Budget', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
finance.delete('/budgets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'budgets', c.req.param('id'), user.organizationId, 'Budget', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Payment Records — custom POST (auto-sequence + document relation), factory for rest
// ────────────────────────────────────────────────────────────────────────────

const PAYMENT_RECORD_PERMITTED_CREATE = new Set([
  'payment_date', 'payment_type', 'payment_method', 'partner_type', 'partner_id',
  'amount', 'currency', 'reference_type', 'reference_id', 'voucher_id', 'notes',
]);

finance.post('/payment-records', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'payment_record',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate payment number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const insertData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PAYMENT_RECORD_PERMITTED_CREATE.has(k)) insertData[k] = v;
  }

  const { data, error } = await db
    .from('payment_records')
    .insert({ ...insertData, payment_number: seqData, organization_id: user.organizationId, status: 'draft' })
    .select('id, payment_number, payment_type')
    .single();

  if (error) throw ApiError.database(error.message, requestId);

  // Record document relation when linked to a voucher
  if (body.voucher_id && data?.id) {
    await createDocumentRelation(db, user.organizationId, 'payment_record', data.id, 'voucher', body.voucher_id, 'payment_record → voucher');
  }

  return c.json({ data }, 201);
});

const paymentRecordsConfig: CrudConfig = {
  table: 'payment_records',
  path: '/payment-records',
  resourceName: 'PaymentRecord',
  listSelect: 'id, payment_number, payment_date, payment_type, partner_type, amount, payment_method, status, created_at',
  detailSelect: payment_records.join(', '),
  createReturnSelect: 'id, payment_number, payment_type',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
};
finance.route('', buildCrudRoutes(paymentRecordsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Payment Requests — full CRUD (custom POST with sequence, factory for rest)
// ────────────────────────────────────────────────────────────────────────────

// Custom POST to auto-generate request_number
finance.post('/payment-requests', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate request_number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'payment_request',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate request number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const PERMITTED_CREATE = new Set(['amount', 'due_date', 'currency', 'supplier_id', 'supplier_invoice_id', 'payment_method', 'notes']);
  const insertData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED_CREATE.has(k)) insertData[k] = v;
  }

  const { data, error } = await db
    .from('payment_requests')
    .insert({
      ...insertData,
      request_number: seqData,
      organization_id: user.organizationId,
      status: 'draft',
      created_by: user.userId,
    })
    .select('id, request_number, status')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// Mount factory routes (list, detail, update, delete — POST handled above)
const paymentRequestsCrud = buildCrudRoutes({
  table: 'payment_requests',
  path: '/payment-requests',
  resourceName: 'PaymentRequest',
  listSelect: 'id, request_number, amount, currency, ok_to_pay, status, payment_method, supplier:suppliers(id,name), supplier_invoice:supplier_invoices(id,invoice_number), created_at',
  detailSelect: '*, supplier:suppliers(id,name,code), supplier_invoice:supplier_invoices(id,invoice_number)',
  createReturnSelect: 'id, request_number, status',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
  audit: true,
  disableCreate: true,
  updateSchema: z.object({
    status: z.string().optional(),
    ok_to_pay: z.boolean().optional(),
    notes: z.string().optional(),
    payment_method: z.string().optional(),
    amount: z.number().optional(),
    due_date: z.string().optional(),
    currency: z.string().optional(),
  }).strict(),
  createDefaults: (user) => ({
    status: 'draft',
    created_by: user.userId,
  }),
});
finance.route('', paymentRequestsCrud);

// ────────────────────────────────────────────────────────────────────────────
// Payment Request Workflow — submit / approve / reject
// ────────────────────────────────────────────────────────────────────────────

// POST /payment-requests/:id/submit — draft → submitted
finance.post('/payment-requests/:id/submit', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await atomicStatusTransition(db, 'payment_requests', id, user.organizationId, 'draft', {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    submitted_by: user.userId,
  }, 'id, request_number, status');

  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PaymentRequest', 'unknown', 'submit', requestId);

  return c.json({ data });
});

// POST /payment-requests/:id/approve — submitted → approved
finance.post('/payment-requests/:id/approve', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await atomicStatusTransition(db, 'payment_requests', id, user.organizationId, 'submitted', {
    status: 'approved',
    ok_to_pay: true,
    approved_at: new Date().toISOString(),
    approved_by: user.userId,
  }, 'id, request_number, status');

  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PaymentRequest', 'unknown', 'approve', requestId);

  return c.json({ data });
});

// POST /payment-requests/:id/reject — submitted → rejected
finance.post('/payment-requests/:id/reject', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  const { data, error } = await atomicStatusTransition(db, 'payment_requests', id, user.organizationId, 'submitted', {
    status: 'rejected',
    rejected_at: new Date().toISOString(),
    rejected_by: user.userId,
    rejection_reason: body.reason ?? null,
  }, 'id, request_number, status');

  if (error) throw ApiError.database((error as any).message, requestId);
  if (!data) throw ApiError.invalidState('PaymentRequest', 'unknown', 'reject', requestId);

  return c.json({ data });
});

// ────────────────────────────────────────────────────────────────────────────
// Budget Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const budgetLinesConfig: CrudConfig = {
  table: 'budget_lines',
  path: '/budget-lines',
  resourceName: 'BudgetLine',
  listSelect: 'id, account_code, period_month, planned_amount, actual_amount, description, cost_center:cost_centers(id,code,name)',
  detailSelect: '*, cost_center:cost_centers(id,code,name)',
  createReturnSelect: 'id, account_code, period_month, planned_amount',
  defaultSort: 'period_month',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'budget_id', parentTable: 'budgets' },
};
finance.route('', buildCrudRoutes(budgetLinesConfig));

// ────────────────────────────────────────────────────────────────────────────
// Voucher Entries — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const voucherEntriesConfig: CrudConfig = {
  table: 'voucher_entries',
  path: '/voucher-entries',
  resourceName: 'VoucherEntry',
  listSelect: 'id, entry_type, amount, summary, sequence, account:account_subjects(id,code,name)',
  detailSelect: '*, account:account_subjects(id,code,name)',
  createReturnSelect: 'id, entry_type, amount',
  defaultSort: 'sequence',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'voucher_id', parentTable: 'vouchers', parentSoftDelete: false },
};
finance.route('', buildCrudRoutes(voucherEntriesConfig));

export default finance;
