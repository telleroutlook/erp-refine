// src/routes/procurement-receiving.ts
// Procurement Receiving REST API — goods receipts, supplier invoices, 3-way match, payment requests

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { createStockTransaction } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const procurementReceiving = new Hono<{ Bindings: Env }>();
procurementReceiving.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Purchase Receipts (Goods Receipt)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/purchase-receipts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('purchase_receipts')
    .select(
      'id, receipt_number, receipt_date, status, purchase_order:purchase_orders(id,order_number), supplier:suppliers(id,name), warehouse:warehouses(id,name), created_at',
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
procurementReceiving.get('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('purchase_receipts')
    .select('*, items:purchase_receipt_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('PurchaseReceipt', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
procurementReceiving.post('/purchase-receipts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate receipt number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'purchase_receipt',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate receipt number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'purchase_receipts',
      itemsTable: 'purchase_receipt_items',
      headerFk: 'purchase_receipt_id',
      headerReturnSelect: 'id, receipt_number, status',
      itemsReturnSelect: 'id, product_id, quantity',
    },
    {
      header: {
        ...headerFields,
        receipt_number: seqData,
        organization_id: user.organizationId,
        status: 'draft',
        created_by: user.userId,
      },
      items: items ?? [],
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_purchase_receipt', resource: 'purchase_receipts' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['status', 'notes', 'received_date']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('purchase_receipts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('PurchaseReceipt', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('purchase_receipts')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseReceipt', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('purchase_receipts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /purchase-receipts/:id/confirm — stock entry (CRITICAL)
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.post('/purchase-receipts/:id/confirm', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Get receipt (no need to fetch items — trigger handles stock/qty updates)
  const { data: receipt, error: fetchError } = await db
    .from('purchase_receipts')
    .select('id, status, receipt_number')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !receipt) throw ApiError.notFound('PurchaseReceipt', id, requestId);

  // 2. Validate status
  if (receipt.status !== 'draft') {
    throw ApiError.invalidState('PurchaseReceipt', receipt.status, 'confirm', requestId);
  }

  // 3. Update status to 'confirmed' — triggers handle stock transactions,
  //    received_quantity on PO items, and PO status automatically.
  const { error: updateError } = await db
    .from('purchase_receipts')
    .update({
      status: 'confirmed',
      confirmed_by: user.userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  return c.json({
    data: { id: receipt.id, receipt_number: receipt.receipt_number, status: 'confirmed' },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Supplier Invoices
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/supplier-invoices', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('supplier_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, total_amount, tax_amount, currency, status, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number)',
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
procurementReceiving.get('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('supplier_invoices')
    .select('*, items:supplier_invoice_items(*, product:products(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('SupplierInvoice', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
procurementReceiving.post('/supplier-invoices', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate invoice number
  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'supplier_invoice',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate invoice number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'supplier_invoices',
      itemsTable: 'supplier_invoice_items',
      headerFk: 'supplier_invoice_id',
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
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_supplier_invoice', resource: 'supplier_invoices' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  const PERMITTED = new Set(['status', 'notes', 'due_date', 'tax_amount']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('supplier_invoices')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('SupplierInvoice', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('supplier_invoices')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierInvoice', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('supplier_invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Three-Way Match (PO / Receipt / Invoice reconciliation)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/three-way-match', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);

  const { data, count, error } = await db
    .from('three_way_match_results')
    .select(
      'id, match_status, po_amount, receipt_amount, invoice_amount, quantity_variance, price_variance, amount_variance, purchase_order:purchase_orders(id,order_number), created_at',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// POST create (run three-way match)
procurementReceiving.post('/three-way-match', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();
  const { purchase_order_id, purchase_receipt_id, supplier_invoice_id } = body;

  // 1. Look up PO total
  const { data: po, error: poErr } = await db
    .from('purchase_orders')
    .select('id, total_amount')
    .eq('id', purchase_order_id)
    .eq('organization_id', user.organizationId)
    .single();
  if (poErr || !po) throw ApiError.notFound('PurchaseOrder', purchase_order_id, requestId);

  // 2. Look up receipt total (sum of item qty * unit_price from PO items)
  const { data: receiptItems, error: rcptErr } = await db
    .from('purchase_receipt_items')
    .select('quantity, purchase_order_item_id')
    .eq('purchase_receipt_id', purchase_receipt_id);

  if (rcptErr) throw ApiError.database(rcptErr.message, requestId);

  let receiptAmount = 0;
  if (receiptItems && receiptItems.length > 0) {
    const poItemIds = receiptItems
      .map((ri: { quantity: unknown; purchase_order_item_id: string }) => ri.purchase_order_item_id)
      .filter(Boolean);

    if (poItemIds.length > 0) {
      const { data: poItems } = await db
        .from('purchase_order_items')
        .select('id, unit_price')
        .in('id', poItemIds);

      const priceMap = new Map(
        (poItems ?? []).map((pi: { id: string; unit_price: number }) => [pi.id, pi.unit_price ?? 0])
      );

      for (const ri of receiptItems) {
        const unitPrice = priceMap.get(ri.purchase_order_item_id) ?? 0;
        receiptAmount += (ri.quantity as number) * unitPrice;
      }
    }
  }

  // 3. Look up invoice total
  const { data: invoice, error: invErr } = await db
    .from('supplier_invoices')
    .select('id, total_amount')
    .eq('id', supplier_invoice_id)
    .eq('organization_id', user.organizationId)
    .single();
  if (invErr || !invoice) throw ApiError.notFound('SupplierInvoice', supplier_invoice_id, requestId);

  const poAmount = po.total_amount ?? 0;
  const invoiceAmount = invoice.total_amount ?? 0;

  // 4. Calculate variance and determine match status
  const variance = Math.abs(poAmount - invoiceAmount) + Math.abs(poAmount - receiptAmount);
  let matchStatus: string;

  if (poAmount === receiptAmount && poAmount === invoiceAmount) {
    matchStatus = 'matched';
  } else if (Math.abs(poAmount - invoiceAmount) < 0.01 && Math.abs(poAmount - receiptAmount) < 0.01) {
    matchStatus = 'matched';
  } else if (variance < poAmount * 0.05) {
    matchStatus = 'partial';
  } else {
    matchStatus = 'mismatch';
  }

  // 5. Insert match result
  const { data: matchResult, error: insertErr } = await db
    .from('three_way_match_results')
    .insert({
      organization_id: user.organizationId,
      purchase_order_id,
      purchase_receipt_id,
      supplier_invoice_id,
      po_amount: poAmount,
      receipt_amount: receiptAmount,
      invoice_amount: invoiceAmount,
      quantity_variance: Math.abs(poAmount - receiptAmount),
      price_variance: Math.abs(poAmount - invoiceAmount),
      amount_variance: variance,
      match_status: matchStatus,
      matched_at: new Date().toISOString(),
    })
    .select('id, match_status, po_amount, receipt_amount, invoice_amount, quantity_variance, price_variance, amount_variance')
    .single();

  if (insertErr) throw ApiError.database(insertErr.message, requestId);
  return c.json({ data: matchResult }, 201);
});

// ────────────────────────────────────────────────────────────────────────────
// Purchase Receipt Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.route('', buildCrudRoutes({
  table: 'purchase_receipt_items',
  path: '/purchase-receipt-items',
  resourceName: 'PurchaseReceiptItem',
  listSelect: 'id, quantity, unit_price, amount, lot_number, notes, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity',
  defaultSort: 'id',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'purchase_receipt_id', parentTable: 'purchase_receipts' },
}));

// ────────────────────────────────────────────────────────────────────────────
// Supplier Invoice Items — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.route('', buildCrudRoutes({
  table: 'supplier_invoice_items',
  path: '/supplier-invoice-items',
  resourceName: 'SupplierInvoiceItem',
  listSelect: 'id, quantity, unit_price, tax_rate, amount, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code)',
  createReturnSelect: 'id, quantity, unit_price',
  defaultSort: 'id',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'supplier_invoice_id', parentTable: 'supplier_invoices' },
}));

export default procurementReceiving;
