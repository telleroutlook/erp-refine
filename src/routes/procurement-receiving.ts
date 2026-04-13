// src/routes/procurement-receiving.ts
// Procurement Receiving REST API — goods receipts, supplier invoices, 3-way match, payment requests

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { atomicCreateWithItems } from '../utils/atomic-helpers';
import { adjustStock, createStockTransaction } from '../utils/stock-helpers';
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
  if (seqError) throw ApiError.database(`Failed to generate receipt number: ${seqError.message}`, requestId);

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

  const { data, error } = await db
    .from('purchase_receipts')
    .update(body)
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

  // 1. Get receipt with items
  const { data: receipt, error: fetchError } = await db
    .from('purchase_receipts')
    .select('*, items:purchase_receipt_items(*)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !receipt) throw ApiError.notFound('PurchaseReceipt', id, requestId);

  // 2. Validate status
  if (receipt.status !== 'draft') {
    throw ApiError.invalidState('PurchaseReceipt', receipt.status, 'confirm', requestId);
  }

  // 3. Process each item: adjust stock + record transaction + update PO item received qty
  for (const item of receipt.items) {
    // 3a. Adjust stock (increase on-hand)
    await adjustStock(db, {
      organizationId: user.organizationId,
      warehouseId: receipt.warehouse_id,
      productId: item.product_id,
      qtyDelta: item.quantity,
    }, requestId);

    // 3b. Record stock transaction
    await createStockTransaction(db, {
      organizationId: user.organizationId,
      warehouseId: receipt.warehouse_id,
      productId: item.product_id,
      transactionType: 'in',
      qty: item.quantity,
      referenceType: 'purchase',
      referenceId: receipt.id,
      createdBy: user.userId,
    }, requestId);

    // 3c. Update PO item received quantity
    if (item.purchase_order_item_id) {
      const { error: poItemErr } = await db.rpc('increment_field', {
        p_table: 'purchase_order_items',
        p_id: item.purchase_order_item_id,
        p_field: 'received_quantity',
        p_delta: item.quantity,
      }).single();

      // Fallback: manual update if RPC not available
      if (poItemErr) {
        const { data: poItem } = await db
          .from('purchase_order_items')
          .select('id, received_quantity')
          .eq('id', item.purchase_order_item_id)
          .single();

        if (poItem) {
          await db
            .from('purchase_order_items')
            .update({ received_quantity: (poItem.received_quantity ?? 0) + item.quantity })
            .eq('id', poItem.id);
        }
      }
    }
  }

  // 4. Update receipt status to confirmed
  const { error: updateError } = await db
    .from('purchase_receipts')
    .update({
      status: 'confirmed',
      confirmed_by: user.userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw ApiError.database(updateError.message, requestId);

  // 5. Check PO completion: if all items fully received, update PO status
  if (receipt.purchase_order_id) {
    const { data: poItems } = await db
      .from('purchase_order_items')
      .select('id, quantity, received_quantity')
      .eq('purchase_order_id', receipt.purchase_order_id);

    if (poItems && poItems.length > 0) {
      const allReceived = poItems.every(
        (poi: { quantity: number; received_quantity: number }) => (poi.received_quantity ?? 0) >= poi.quantity
      );
      const someReceived = poItems.some(
        (poi: { quantity: number; received_quantity: number }) => (poi.received_quantity ?? 0) > 0
      );

      let poStatus: string | undefined;
      if (allReceived) {
        poStatus = 'received';
      } else if (someReceived) {
        poStatus = 'partially_received';
      }

      if (poStatus) {
        await db
          .from('purchase_orders')
          .update({ status: poStatus })
          .eq('id', receipt.purchase_order_id);
      }
    }
  }

  // 6. Return confirmed receipt
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
  if (seqError) throw ApiError.database(`Failed to generate invoice number: ${seqError.message}`, requestId);

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
        uploaded_by: user.userId,
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

  const { data, error } = await db
    .from('supplier_invoices')
    .update(body)
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
      'id, match_status, quantity_variance, price_variance, amount_variance, purchase_order:purchase_orders(id,order_number), created_at',
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
      .map((ri: { quantity: any; purchase_order_item_id: string }) => ri.purchase_order_item_id)
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
        receiptAmount += ri.quantity * unitPrice;
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
      quantity_variance: Math.abs(poAmount - receiptAmount),
      price_variance: Math.abs(poAmount - invoiceAmount),
      amount_variance: variance,
      match_status: matchStatus,
      matched_at: new Date().toISOString(),
    })
    .select('id, match_status, quantity_variance, price_variance, amount_variance')
    .single();

  if (insertErr) throw ApiError.database(insertErr.message, requestId);
  return c.json({ data: matchResult }, 201);
});

// ────────────────────────────────────────────────────────────────────────────
// Payment Requests (full CRUD via crud-factory)
// ────────────────────────────────────────────────────────────────────────────

// Custom POST to auto-generate request_number via sequence
procurementReceiving.post('/payment-requests', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  // Auto-generate request number
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

// Mount crud-factory routes (list, detail, update, delete — POST is handled above)
const paymentCrud = buildCrudRoutes({
  table: 'payment_requests',
  path: '/payment-requests',
  resourceName: 'PaymentRequest',
  listSelect:
    'id, request_number, amount, currency, ok_to_pay, status, payment_method, supplier:suppliers(id,name), supplier_invoice:supplier_invoices(id,invoice_number), created_at',
  detailSelect:
    '*, supplier:suppliers(id,name,code), supplier_invoice:supplier_invoices(id,invoice_number)',
  createReturnSelect: 'id, request_number, status',
  defaultSort: 'created_at',
  softDelete: true,
  orgScoped: true,
  audit: true,
  disableCreate: true, // POST handled above with sequence generation
  createDefaults: (user) => ({
    status: 'draft',
    requested_by: user.userId,
  }),
});

procurementReceiving.route('', paymentCrud);

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
}));

export default procurementReceiving;
