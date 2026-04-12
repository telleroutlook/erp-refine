// src/routes/sales-finance.ts
// Sales Finance REST API — invoices, returns, customer receipts (AR)

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { adjustStock, createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const salesFinance = new Hono<{ Bindings: Env }>();
salesFinance.use('*', authMiddleware());

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
    .select('*, items:sales_invoice_items(*, product:products(id,name,code))')
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
  if (seqError) throw ApiError.database(`Failed to generate invoice number: ${seqError.message}`, requestId);

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

  const { data, error } = await db
    .from('sales_invoices')
    .update(body)
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
  const id = c.req.param('id');

  const { error } = await db
    .from('sales_invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
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
  if (seqError) throw ApiError.database(`Failed to generate return number: ${seqError.message}`, requestId);

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

  const { data, error } = await db
    .from('sales_returns')
    .update(body)
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
  const id = c.req.param('id');

  const { error } = await db
    .from('sales_returns')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
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

  // 3. Process each item: adjust stock (increase) + record transaction
  for (const item of salesReturn.items) {
    // 3a. Adjust stock (return to inventory)
    await adjustStock(db, {
      organizationId: user.organizationId,
      warehouseId: salesReturn.warehouse_id,
      productId: item.product_id,
      qtyDelta: item.quantity,
    }, requestId);

    // 3b. Record stock transaction
    await createStockTransaction(db, {
      organizationId: user.organizationId,
      warehouseId: salesReturn.warehouse_id,
      productId: item.product_id,
      transactionType: 'in',
      qty: item.quantity,
      referenceType: 'sales_return',
      referenceId: salesReturn.id,
      createdBy: user.userId,
    }, requestId);
  }

  // 4. Update return status to 'received'
  const { error: updateError } = await db
    .from('sales_returns')
    .update({
      status: 'received',
      received_by: user.userId,
      received_at: new Date().toISOString(),
    })
    .eq('id', id);

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
      'id, receipt_number, receipt_date, amount, currency, payment_method, customer:customers(id,name), sales_invoice:sales_invoices(id,invoice_number)',
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
    .select('*, customer:customers(id,name), sales_invoice:sales_invoices(id,invoice_number)')
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
  if (seqError) throw ApiError.database(`Failed to generate receipt number: ${seqError.message}`, requestId);

  const { data: receipt, error: insertError } = await db
    .from('customer_receipts')
    .insert({
      ...body,
      receipt_number: seqData,
      organization_id: user.organizationId,
      created_by: user.userId,
    })
    .select('id, receipt_number, amount, sales_invoice_id')
    .single();

  if (insertError) throw ApiError.database(insertError.message, requestId);

  // Check if the linked invoice is fully paid
  if (receipt.sales_invoice_id) {
    // Sum all receipts for this invoice
    const { data: receiptsSum, error: sumError } = await db
      .from('customer_receipts')
      .select('amount')
      .eq('sales_invoice_id', receipt.sales_invoice_id)
      .eq('organization_id', user.organizationId)
      .is('deleted_at', null);

    if (!sumError && receiptsSum) {
      const totalPaid = receiptsSum.reduce(
        (sum: number, r: { amount: number }) => sum + (r.amount ?? 0),
        0
      );

      // Get invoice total
      const { data: invoice } = await db
        .from('sales_invoices')
        .select('id, total_amount')
        .eq('id', receipt.sales_invoice_id)
        .single();

      if (invoice && totalPaid >= (invoice.total_amount ?? 0)) {
        await db
          .from('sales_invoices')
          .update({ status: 'paid' })
          .eq('id', receipt.sales_invoice_id);
      }
    }
  }

  return c.json({ data: receipt }, 201);
});

// PUT update
salesFinance.put('/customer-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await db
    .from('customer_receipts')
    .update(body)
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
  const id = c.req.param('id');

  const { error } = await db
    .from('customer_receipts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

export default salesFinance;
