// src/routes/finance.ts
// Finance REST API — Account subjects, cost centers, vouchers, budgets, payments

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { ApiError } from '../utils/api-error';

const finance = new Hono<{ Bindings: Env }>();
finance.use('*', authMiddleware());

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
  softDelete: false,
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

  const { data, count, error } = await db
    .from('vouchers')
    .select('id, voucher_number, voucher_date, voucher_type, notes, total_debit, total_credit, status', { count: 'exact' })
    .eq('organization_id', user.organizationId)
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
    .select('*, entries:voucher_entries(*, account:account_subjects(id,code,name), cost_center:cost_centers(id,code,name))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
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
  if (seqError) throw ApiError.database(`Failed to generate voucher number: ${seqError.message}`, requestId);

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

  const { data, error } = await db
    .from('vouchers')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Voucher', id, requestId);
  return c.json({ data });
});

// DELETE (hard delete — vouchers has no deleted_at)
finance.delete('/vouchers/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

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

  // 1. Get voucher
  const { data: voucher, error: fetchError } = await db
    .from('vouchers')
    .select('id, voucher_number, status, total_debit, total_credit')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .single();

  if (fetchError || !voucher) throw ApiError.notFound('Voucher', id, requestId);

  // 2. Validate status
  if (voucher.status !== 'draft' && voucher.status !== 'reviewed') {
    throw ApiError.invalidState('Voucher', voucher.status, 'post', requestId);
  }

  // 3. Validate debit == credit
  if (Math.abs((voucher.total_debit ?? 0) - (voucher.total_credit ?? 0)) > 0.01) {
    throw ApiError.validation(
      `Cannot post voucher: debit (${voucher.total_debit}) does not equal credit (${voucher.total_credit}).`,
      [],
      requestId,
      'Update voucher entries so debits equal credits before posting.'
    );
  }

  // 4. Update status to 'posted'
  const { error: updateError } = await db
    .from('vouchers')
    .update({
      status: 'posted',
      posted_by: user.userId,
      posted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({
    data: { id: voucher.id, voucher_number: voucher.voucher_number, status: 'posted' },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Budgets — atomic create (header + lines)
// ────────────────────────────────────────────────────────────────────────────

// GET list
finance.get('/budgets', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('budgets')
    .select(
      'id, budget_name, budget_year, budget_type, total_amount, currency, status',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
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

  const { data, error } = await db
    .from('budgets')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Budget', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
finance.delete('/budgets/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('budgets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Payment Records — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const paymentRecordsConfig: CrudConfig = {
  table: 'payment_records',
  path: '/payment-records',
  resourceName: 'PaymentRecord',
  listSelect: 'id, payment_number, payment_date, payment_type, partner_type, amount, payment_method, status, created_at',
  detailSelect: '*',
  createReturnSelect: 'id, payment_number, payment_type',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
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
  if (seqError) throw ApiError.database(`Failed to generate request number: ${seqError.message}`, requestId);

  const { data, error } = await db
    .from('payment_requests')
    .insert({
      ...body,
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
  listSelect: 'id, request_number, amount, currency, due_date, ok_to_pay, status, payment_method, supplier:suppliers(id,name), supplier_invoice:supplier_invoices(id,invoice_number), created_at',
  detailSelect: '*, supplier:suppliers(id,name,code), supplier_invoice:supplier_invoices(id,invoice_number)',
  createReturnSelect: 'id, request_number, status',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
  audit: true,
  disableCreate: true, // POST handled above with sequence generation
  createDefaults: (user) => ({
    status: 'draft',
    created_by: user.userId,
  }),
});
finance.route('', paymentRequestsCrud);

export default finance;
