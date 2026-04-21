// src/routes/sales-finance.ts
// Sales Finance REST API — invoices, returns, customer receipts (AR)

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { batchCreateStockTransactions } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const salesFinance = new Hono<{ Bindings: Env }>();
salesFinance.use('*', authMiddleware());
salesFinance.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Sales Invoices (full CRUD with items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
salesFinance.get('/sales-invoices', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, total_amount, tax_amount, currency, status, customer:customers(id,name), sales_order:sales_orders(id,order_number)',
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
salesFinance.get('/sales-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_invoices')
    .select('*, customer:customers(id,name), sales_order:sales_orders(id,order_number), items:sales_invoice_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SalesInvoice', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
salesFinance.post('/sales-invoices', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate invoice number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'sales_invoice',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate invoice number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'sales_invoices',
      itemsTable: 'sales_invoice_items',
      headerFk: 'sales_invoice_id',
      headerReturnSelect: 'id, invoice_number, status',
      itemsReturnSelect: 'id, product_id, quantity, unit_price',
    },
    {
      header: {
        ...headerFields,
        invoice_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
      },
      items: items ?? [],
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_sales_invoice', resource: 'sales_invoices' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
salesFinance.put('/sales-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  // status is intentionally excluded — invoice status must change through workflow endpoints
  const PERMITTED = new Set(['notes', 'due_date', 'tax_amount', 'discount_amount']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('sales_invoices')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('SalesInvoice', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('sales_invoices')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesInvoice', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
salesFinance.delete('/sales-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'sales_invoices', c.req.param('id'), user.organizationId, 'SalesInvoice', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Returns (with items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
salesFinance.get('/sales-returns', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('sales_returns')
    .select(
      'id, return_number, return_date, total_amount, status, reason, customer:customers(id,name), sales_order:sales_orders(id,order_number)',
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
salesFinance.get('/sales-returns/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_returns')
    .select('*, items:sales_return_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SalesReturn', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
salesFinance.post('/sales-returns', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate return number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'sales_return',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate return number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'sales_returns',
      itemsTable: 'sales_return_items',
      headerFk: 'sales_return_id',
      headerReturnSelect: 'id, return_number, status',
      itemsReturnSelect: 'id, product_id, quantity',
    },
    {
      header: {
        ...headerFields,
        return_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
      },
      items: items ?? [],
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_sales_return', resource: 'sales_returns' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
salesFinance.put('/sales-returns/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['status', 'notes', 'reason', 'warehouse_id']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('sales_returns')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('SalesReturn', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('sales_returns')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SalesReturn', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
salesFinance.delete('/sales-returns/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'sales_returns', c.req.param('id'), user.organizationId, 'SalesReturn', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /sales-returns/:id/receive — stock return entry
// ────────────────────────────────────────────────────────────────────────────

salesFinance.post('/sales-returns/:id/receive', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get return with items
  const { data: salesReturn, error: fetchError } = await db
    .from('sales_returns')
    .select('*, items:sales_return_items(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !salesReturn) throw ApiError.notFound('SalesReturn', id, requestId);

  // 2. Validate status is 'approved'
  if (salesReturn.status !== 'approved') {
    throw ApiError.invalidState('SalesReturn', salesReturn.status, 'receive', requestId);
  }

  // 3. Batch-insert all stock-in transactions (trigger updates stock_records per row)
  await batchCreateStockTransactions(
    db,
    (salesReturn.items as Record<string, unknown>[]).map((item) => ({
      organizationId: user.organizationId,
      warehouseId: salesReturn.warehouse_id,
      productId: item.product_id as string,
      transactionType: 'in' as const,
      qty: item.quantity as number,
      referenceType: 'sales_return',
      referenceId: salesReturn.id,
      createdBy: user.userId,
    })),
    requestId
  );

  // 4. Update return status to 'received'
  const { error: updateError } = await db
    .from('sales_returns')
    .update({
      status: 'received',
    })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({
    data: { id: salesReturn.id, return_number: salesReturn.return_number, status: 'received' },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Customer Receipts (AR Collection)
// ────────────────────────────────────────────────────────────────────────────

// GET list
salesFinance.get('/customer-receipts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('customer_receipts')
    .select(
      'id, receipt_number, receipt_date, amount, payment_method, reference_type, reference_id, status, customer:customers(id,name)',
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
salesFinance.get('/customer-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('customer_receipts')
    .select('*, customer:customers(id,name)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('CustomerReceipt', id, requestId);
  return c.json({ data });
});

// POST create (with auto-sequence + invoice payment check)
salesFinance.post('/customer-receipts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate receipt number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'customer_receipt',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate receipt number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const PERMITTED_RECEIPT = new Set(['receipt_date', 'amount', 'reference_type', 'reference_id', 'payment_method', 'notes', 'customer_id']);
  const insertData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED_RECEIPT.has(k)) insertData[k] = v;
  }

  const { data: receipt, error: insertError } = await db
    .from('customer_receipts')
    .insert({
      ...insertData,
      receipt_number: seqData,
      organization_id: user.organizationId,
      created_by: user.userId,
    })
    .select('id, receipt_number, amount, reference_type, reference_id')
    .single();

  if (insertError) throw ApiError.database(insertError.message, requestId);

  // Check if the linked invoice is fully paid
  if (receipt.reference_type === 'sales_invoice' && receipt.reference_id) {
    // Run sum and invoice fetch in parallel
    const [sumResult, invoiceResult] = await Promise.all([
      db
        .from('customer_receipts')
        .select('total:amount.sum()')
        .eq('reference_type', 'sales_invoice')
        .eq('reference_id', receipt.reference_id)
        .eq('organization_id', user.organizationId)
        .is('deleted_at', null)
        .single(),
      db
        .from('sales_invoices')
        .select('id, total_amount')
        .eq('id', receipt.reference_id)
        .eq('organization_id', user.organizationId)
        .single(),
    ]);

    const totalPaid = Number((sumResult.data as any)?.total ?? 0);
    const invoice = invoiceResult.data;

    if (invoice && totalPaid >= (invoice.total_amount ?? 0)) {
      const { error: paidErr } = await db
        .from('sales_invoices')
        .update({ status: 'paid' })
        .eq('id', receipt.reference_id)
        .eq('organization_id', user.organizationId);
      if (paidErr) throw ApiError.database(paidErr.message, requestId);
    }
  }

  return c.json({ data: receipt }, 201);
});

// PUT update
salesFinance.put('/customer-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['notes', 'payment_method', 'bank_account']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('customer_receipts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('CustomerReceipt', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('customer_receipts')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('CustomerReceipt', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
salesFinance.delete('/customer-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'customer_receipts', c.req.param('id'), user.organizationId, 'CustomerReceipt', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Invoice Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

salesFinance.route('', buildCrudRoutes({
  table: 'sales_invoice_items',
  path: '/sales-invoice-items',
  resourceName: 'SalesInvoiceItem',
  listSelect: 'id, quantity, unit_price, tax_rate, discount_rate, amount, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity, unit_price',
  defaultSort: 'id',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'sales_invoice_id', parentTable: 'sales_invoices' },
}));

// ────────────────────────────────────────────────────────────────────────────
// Sales Return Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

salesFinance.route('', buildCrudRoutes({
  table: 'sales_return_items',
  path: '/sales-return-items',
  resourceName: 'SalesReturnItem',
  listSelect: 'id, quantity, unit_price, amount, reason, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity',
  defaultSort: 'id',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'sales_return_id', parentTable: 'sales_returns' },
}));

export default salesFinance;
