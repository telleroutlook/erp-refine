// src/routes/sales-finance.ts
// Sales Finance REST API — invoices, returns, customer receipts (AR)

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, buildSelectWithItemFilter, applyItemFilters, atomicStatusTransition } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { batchCreateStockTransactions } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';
import { findFlow } from '../utils/document-flow';
import { fetchSourceWithOpenQuantities, buildPrefilledData, createDocumentRelation, validateItemsAgainstSource, validateReceiptAmount } from '../utils/create-from-helpers';

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
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'sales_invoice_items' };

  const baseSelect = 'id, invoice_number, invoice_date, due_date, total_amount, tax_amount, currency, status, customer:customers(id,name), sales_order:sales_orders(id,order_number)';
  let query = db
    .from('sales_invoices')
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

// GET create-from: SO → Sales Invoice (参考销售订单创建销售发票)
salesFinance.get('/sales-invoices/create-from/sales-order/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('sales_order', 'sales_invoice')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully invoiced', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// GET create-from: Shipment → Sales Invoice (参考发货单创建销售发票)
salesFinance.get('/sales-invoices/create-from/sales-shipment/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('sales_shipment', 'sales_invoice')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully invoiced', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
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

  const { items, _sourceRef, ...headerFields } = body;

  // Validate quantities against source open items
  if (_sourceRef?.type && _sourceRef?.id && items?.length) {
    const flowKey = _sourceRef.type === 'sales_shipment' ? 'sales_shipment' : 'sales_order';
    const flow = findFlow(flowKey, 'sales_invoice')!;
    await validateItemsAgainstSource(db, flow, _sourceRef.id, items, user.organizationId, requestId);
  }

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

  if (_sourceRef?.type && _sourceRef?.id) {
    await createDocumentRelation(db, user.organizationId, _sourceRef.type, _sourceRef.id, 'sales_invoice', result.header.id as string, `${_sourceRef.type} → sales_invoice`);
  }

  return c.json({ data: result.header }, 201);
});

// PUT update
salesFinance.put('/sales-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  // status is intentionally excluded — invoice status must change through workflow endpoints
  const PERMITTED = new Set(['notes', 'due_date', 'tax_amount']);

  if (body.items) {
    const result = await atomicUpdateWithItems(
      db,
      {
        headerTable: 'sales_invoices',
        itemsTable: 'sales_invoice_items',
        headerFk: 'sales_invoice_id',
        headerPermittedFields: [...PERMITTED],
        itemsReturnSelect: '*, product:products(id,name,code)',
        headerReturnSelect: 'id',
        autoSum: { headerField: 'total_amount', itemAmountExpr: (item) => Number(item.amount ?? 0) },
      },
      id,
      user.organizationId,
      { header: body, items: body.items },
      requestId,
    );
    return c.json({ data: result.header });
  }

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
    .is('deleted_at', null)
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

// POST issue: draft → issued (triggers invoiced_quantity update on SO items)
salesFinance.post('/sales-invoices/:id/issue', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: invoice, error: fetchError } = await db
    .from('sales_invoices')
    .select('id, invoice_number, status, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !invoice) throw ApiError.notFound('SalesInvoice', id, requestId);
  if (invoice.status !== 'draft') {
    throw ApiError.invalidState('SalesInvoice', invoice.status, 'issue', requestId);
  }

  const { data: transitioned, error: updateError } = await atomicStatusTransition(
    db, 'sales_invoices', id, user.organizationId,
    'draft',
    { status: 'issued' }
  );
  if (updateError) throw ApiError.database((updateError as any).message, requestId);
  if (!transitioned) throw ApiError.invalidState('SalesInvoice', invoice.status, 'issue', requestId);

  return c.json({ data: { id: invoice.id, invoice_number: invoice.invoice_number, status: 'issued' } });
});

// ────────────────────────────────────────────────────────────────────────────
// Sales Returns (with items)
// ────────────────────────────────────────────────────────────────────────────

// GET list
salesFinance.get('/sales-returns', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'sales_return_items' };

  const baseSelect = 'id, return_number, return_date, total_amount, status, reason, customer:customers(id,name), sales_order:sales_orders(id,order_number)';
  let query = db
    .from('sales_returns')
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

// GET detail
salesFinance.get('/sales-returns/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('sales_returns')
    .select('*, customer:customers(id,name,code), sales_order:sales_orders(id,order_number,currency), items:sales_return_items(*, product:products(id,name,code))')
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

  if (body.items) {
    const result = await atomicUpdateWithItems(
      db,
      {
        headerTable: 'sales_returns',
        itemsTable: 'sales_return_items',
        headerFk: 'sales_return_id',
        headerPermittedFields: [...PERMITTED],
        itemsReturnSelect: '*, product:products(id,name,code)',
        headerReturnSelect: 'id',
        autoSum: { headerField: 'total_amount', itemAmountExpr: (item) => Number(item.amount ?? 0) },
      },
      id,
      user.organizationId,
      { header: body, items: body.items },
      requestId,
    );
    return c.json({ data: result.header });
  }

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
    .is('deleted_at', null)
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

  // 2. Validate status is 'approved' — but don't rely on this for safety (CAS below)
  if (salesReturn.status !== 'approved') {
    throw ApiError.invalidState('SalesReturn', salesReturn.status, 'receive', requestId);
  }

  // 3. Validate warehouse
  if (!salesReturn.warehouse_id) {
    throw ApiError.badRequest('Warehouse is required to receive a sales return', requestId);
  }

  // 4. Atomic status transition FIRST: approved → received (prevents duplicate processing)
  const { data: transitioned, error: transErr } = await atomicStatusTransition(
    db, 'sales_returns', id, user.organizationId,
    'approved', { status: 'received' },
    'id, return_number, status'
  );
  if (transErr) throw ApiError.database((transErr as any).message, requestId);
  if (!transitioned) throw ApiError.invalidState('SalesReturn', 'unknown', 'receive', requestId);

  // 5. Batch-insert all stock-in transactions
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
  const filters = parseRefineFilters(c);

  let query = db
    .from('customer_receipts')
    .select(
      'id, receipt_number, receipt_date, amount, payment_method, reference_type, reference_id, status, customer:customers(id,name)',
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

  // Validate receipt amount does not exceed invoice outstanding
  if (insertData.reference_type === 'sales_invoice' && insertData.reference_id) {
    await validateReceiptAmount(
      db,
      insertData.reference_type as string,
      insertData.reference_id as string,
      Number(insertData.amount ?? 0),
      user.organizationId,
      requestId
    );
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

  if (receipt.reference_type === 'sales_invoice' && receipt.reference_id) {
    const [receiptsResult, invoiceResult] = await Promise.all([
      db
        .from('customer_receipts')
        .select('amount')
        .eq('reference_type', 'sales_invoice')
        .eq('reference_id', receipt.reference_id)
        .eq('organization_id', user.organizationId)
        .is('deleted_at', null),
      db
        .from('sales_invoices')
        .select('id, total_amount, tax_amount, sales_order_id')
        .eq('id', receipt.reference_id)
        .eq('organization_id', user.organizationId)
        .single(),
    ]);

    const totalPaid = (receiptsResult.data ?? []).reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
    const invoice = invoiceResult.data;
    const invoicePayable = Number(invoice?.total_amount ?? 0) + Number(invoice?.tax_amount ?? 0);

    if (invoice && totalPaid >= invoicePayable) {
      const { error: paidErr } = await db
        .from('sales_invoices')
        .update({ status: 'paid' })
        .eq('id', receipt.reference_id)
        .eq('organization_id', user.organizationId)
        .in('status', ['issued', 'partial']);
      if (paidErr) throw ApiError.database(paidErr.message, requestId);
    }

    if (invoice?.sales_order_id) {
      const soId = invoice.sales_order_id;

      const { data: soInvoices } = await db
        .from('sales_invoices')
        .select('id, total_amount, tax_amount')
        .eq('sales_order_id', soId)
        .eq('organization_id', user.organizationId)
        .in('status', ['issued', 'paid'])
        .is('deleted_at', null);

      const totalInvoiced = (soInvoices ?? []).reduce((sum: number, inv: any) => sum + Number(inv.total_amount ?? 0) + Number(inv.tax_amount ?? 0), 0);
      const invoiceIds = (soInvoices ?? []).map((inv: any) => inv.id);

      let totalReceived = 0;
      if (invoiceIds.length > 0) {
        const { data: allReceipts } = await db
          .from('customer_receipts')
          .select('amount')
          .eq('reference_type', 'sales_invoice')
          .in('reference_id', invoiceIds)
          .eq('organization_id', user.organizationId)
          .is('deleted_at', null);
        totalReceived = (allReceipts ?? []).reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
      }

      let paymentStatus: 'paid' | 'partial' | 'unpaid';
      if (totalInvoiced > 0 && totalReceived >= totalInvoiced) {
        paymentStatus = 'paid';
      } else if (totalReceived > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }

      await db.from('sales_orders').update({ payment_status: paymentStatus }).eq('id', soId).eq('organization_id', user.organizationId).is('deleted_at', null);
    }
  }

  return c.json({ data: receipt }, 201);
});

// PUT update
salesFinance.put('/customer-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['notes', 'payment_method']);
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
    .is('deleted_at', null)
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
