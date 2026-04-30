// src/routes/procurement-receiving.ts
// Procurement Receiving REST API — goods receipts, supplier invoices, 3-way match, payment requests

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, performSoftDelete } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery, parseRefineFilters, parseItemFilters } from '../utils/query-helpers';
import { applyFilters, resolveEmployeeId, buildSelectWithItemFilter, applyItemFilters, atomicStatusTransition } from '../utils/database';
import { atomicCreateWithItems, atomicUpdateWithItems, type AtomicUpdateConfig } from '../utils/atomic-helpers';
import { createStockTransaction, batchCreateStockTransactions } from '../utils/stock-helpers';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';
import { findFlow } from '../utils/document-flow';
import { fetchSourceWithOpenQuantities, buildPrefilledData, createDocumentRelation, validateItemsAgainstSource } from '../utils/create-from-helpers';

const procurementReceiving = new Hono<{ Bindings: Env }>();
procurementReceiving.use('*', authMiddleware());
procurementReceiving.use('*', writeMethodGuard());

// ────────────────────────────────────────────────────────────────────────────
// Purchase Receipts (Goods Receipt)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/purchase-receipts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'purchase_receipt_items' };

  const baseSelect = 'id, receipt_number, receipt_date, status, purchase_order:purchase_orders(id,order_number), supplier:suppliers(id,name), warehouse:warehouses(id,name), created_at';
  let query = db
    .from('purchase_receipts')
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

// GET create-from: PO → Purchase Receipt (参考采购订单创建收货单)
procurementReceiving.get('/purchase-receipts/create-from/purchase-order/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('purchase_order', 'purchase_receipt')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully received', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// GET detail
procurementReceiving.get('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('purchase_receipts')
    .select('*, purchase_order:purchase_orders(id,order_number), supplier:suppliers(id,name), items:purchase_receipt_items(*, product:products(id,name,code,uom))')
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

  const { items, _sourceRef, ...headerFields } = body;

  // Validate quantities against source open items
  if (_sourceRef?.type === 'purchase_order' && _sourceRef?.id && items?.length) {
    const flow = findFlow('purchase_order', 'purchase_receipt')!;
    await validateItemsAgainstSource(db, flow, _sourceRef.id, items, user.organizationId, requestId);
  }

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

  if (_sourceRef?.type && _sourceRef?.id) {
    await createDocumentRelation(db, user.organizationId, _sourceRef.type, _sourceRef.id, 'purchase_receipt', result.header.id as string, `${_sourceRef.type} → purchase_receipt`);
  }

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'purchase_receipts',
      itemsTable: 'purchase_receipt_items',
      headerFk: 'purchase_receipt_id',
      headerPermittedFields: ['status', 'notes', 'receipt_date', 'warehouse_id'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['status', 'notes', 'receipt_date', 'warehouse_id']);
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
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('PurchaseReceipt', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/purchase-receipts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'purchase_receipts', c.req.param('id'), user.organizationId, 'PurchaseReceipt', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /purchase-receipts/:id/confirm — stock entry + auto QI for inspection items
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.post('/purchase-receipts/:id/confirm', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  // 1. Fetch receipt with items + product inspection flag
  const { data: receipt, error: fetchError } = await db
    .from('purchase_receipts')
    .select(`id, status, receipt_number, warehouse_id, organization_id, purchase_order_id,
      items:purchase_receipt_items(id, product_id, quantity, lot_number, purchase_order_item_id,
        product:products(id, name, code, requires_inspection))`)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !receipt) throw ApiError.notFound('PurchaseReceipt', id, requestId);
  if (receipt.status !== 'draft') {
    throw ApiError.invalidState('PurchaseReceipt', receipt.status, 'confirm', requestId);
  }
  if (!receipt.warehouse_id) {
    throw ApiError.badRequest('Warehouse is required to confirm a receipt', requestId);
  }

  const items = (receipt as any).items ?? [];
  const immediateItems = items.filter((i: any) => !i.product?.requires_inspection);
  const inspectionItems = items.filter((i: any) => i.product?.requires_inspection);

  // 2. Atomic status transition to prevent duplicate processing
  const { data: transitioned, error: updateError } = await atomicStatusTransition(
    db, 'purchase_receipts', id, user.organizationId,
    'draft',
    { status: 'confirmed', confirmed_by: user.userId, confirmed_at: new Date().toISOString() }
  );
  if (updateError) throw ApiError.database((updateError as any).message, requestId);
  if (!transitioned) throw ApiError.invalidState('PurchaseReceipt', receipt.status, 'confirm', requestId);

  // 3. Stock-in for items NOT requiring inspection (trigger auto-syncs stock_records)
  if (immediateItems.length > 0) {
    await batchCreateStockTransactions(db, immediateItems.map((item: any) => ({
      organizationId: user.organizationId,
      warehouseId: receipt.warehouse_id!,
      productId: item.product_id,
      transactionType: 'in' as const,
      qty: Number(item.quantity),
      referenceType: 'purchase_receipt',
      referenceId: receipt.id,
      lotNumber: item.lot_number ?? undefined,
      createdBy: user.userId,
    })), requestId);

    // Update PO received_quantity atomically
    await Promise.all(
      immediateItems
        .filter((item: any) => item.purchase_order_item_id)
        .map((item: any) =>
          db.rpc('increment_po_received_qty', {
            p_poi_id: item.purchase_order_item_id,
            p_qty: Number(item.quantity),
          })
        )
    );
  }

  // 4. Auto-create quality inspections for items requiring inspection
  let inspectionsCreated = 0;
  if (inspectionItems.length > 0) {
    const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
    for (const item of inspectionItems) {
      const { data: seqData } = await db.rpc('get_next_sequence', {
        p_organization_id: user.organizationId,
        p_sequence_name: 'quality_inspection',
      });

      const { data: qi } = await db.from('quality_inspections').insert({
        inspection_number: seqData,
        organization_id: user.organizationId,
        product_id: item.product_id,
        reference_type: 'purchase_receipt',
        reference_id: receipt.id,
        purchase_receipt_item_id: item.id,
        total_quantity: Number(item.quantity),
        qualified_quantity: 0,
        defective_quantity: 0,
        inspection_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        result: 'pending',
        created_by: empId,
      }).select('id, inspection_number').single();

      if (qi) {
        await createDocumentRelation(
          db, user.organizationId,
          'purchase_receipt', receipt.id,
          'quality_inspection', qi.id,
          'receipt_to_inspection'
        );
        inspectionsCreated++;
      }
    }
  }

  if (receipt.purchase_order_id) {
    await db.rpc('update_po_status_from_items', {
      p_po_id: receipt.purchase_order_id,
      p_org_id: user.organizationId,
    });
  }

  const confirmedStatus = 'confirmed';
  return c.json({
    data: {
      id: receipt.id,
      receipt_number: receipt.receipt_number,
      status: confirmedStatus,
      stock_transactions_created: immediateItems.length,
      inspections_created: inspectionsCreated,
    },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Supplier Invoices
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/supplier-invoices', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);
  const itemFilters = parseItemFilters(c);
  const itemJoin = { itemsTable: 'supplier_invoice_items' };

  const baseSelect = 'id, invoice_number, invoice_date, due_date, total_amount, tax_amount, currency, status, supplier:suppliers(id,name), purchase_order:purchase_orders(id,order_number)';
  let query = db
    .from('supplier_invoices')
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

// GET create-from: PO → Supplier Invoice (参考采购订单创建供应商发票)
procurementReceiving.get('/supplier-invoices/create-from/purchase-order/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('purchase_order', 'supplier_invoice')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully invoiced', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// GET create-from: Receipt → Supplier Invoice (参考收货单创建供应商发票)
procurementReceiving.get('/supplier-invoices/create-from/purchase-receipt/:sourceId', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const sourceId = c.req.param('sourceId');
  const flow = findFlow('purchase_receipt', 'supplier_invoice')!;
  const { source, items } = await fetchSourceWithOpenQuantities(db, flow, sourceId, user.organizationId, requestId);
  if (items.length === 0) throw ApiError.badRequest('All items are fully invoiced', requestId);
  const preview = buildPrefilledData(flow, source, items);
  return c.json({ data: preview });
});

// GET detail
procurementReceiving.get('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('supplier_invoices')
    .select('*, supplier:suppliers(id,name), items:supplier_invoice_items(*, product:products(id,name,code))')
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

  const empId = await resolveEmployeeId(db, user.userId, user.organizationId);
  const { items, _sourceRef, ...headerFields } = body;

  // Validate quantities against source open items
  if (_sourceRef?.type && _sourceRef?.id && items?.length) {
    const flowKey = _sourceRef.type === 'purchase_receipt' ? 'purchase_receipt' : 'purchase_order';
    const flow = findFlow(flowKey, 'supplier_invoice')!;
    await validateItemsAgainstSource(db, flow, _sourceRef.id, items, user.organizationId, requestId);
  }

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
        created_by: empId,
      },
      items: items ?? [],
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_supplier_invoice', resource: 'supplier_invoices' }
  );

  if (_sourceRef?.type && _sourceRef?.id) {
    await createDocumentRelation(db, user.organizationId, _sourceRef.type, _sourceRef.id, 'supplier_invoice', result.header.id as string, `${_sourceRef.type} → supplier_invoice`);
  }

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'supplier_invoices',
      itemsTable: 'supplier_invoice_items',
      headerFk: 'supplier_invoice_id',
      headerPermittedFields: ['status', 'notes', 'due_date', 'tax_amount', 'currency'],
      itemsReturnSelect: '*, product:products(id,name,code)',
      headerReturnSelect: 'id',
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['status', 'notes', 'due_date', 'tax_amount', 'currency']);
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
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierInvoice', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/supplier-invoices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'supplier_invoices', c.req.param('id'), user.organizationId, 'SupplierInvoice', requestId);
  return c.json({ data: { success: true } });
});

// POST verify: draft → verified (triggers invoiced_quantity update on PO items)
procurementReceiving.post('/supplier-invoices/:id/verify', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data: invoice, error: fetchError } = await db
    .from('supplier_invoices')
    .select('id, invoice_number, status, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !invoice) throw ApiError.notFound('SupplierInvoice', id, requestId);
  if (invoice.status !== 'draft') {
    throw ApiError.invalidState('SupplierInvoice', invoice.status, 'verify', requestId);
  }

  const { data: transitioned, error: updateError } = await atomicStatusTransition(
    db, 'supplier_invoices', id, user.organizationId,
    'draft',
    { status: 'verified' }
  );
  if (updateError) throw ApiError.database((updateError as any).message, requestId);
  if (!transitioned) throw ApiError.invalidState('SupplierInvoice', invoice.status, 'verify', requestId);

  return c.json({ data: { id: invoice.id, invoice_number: invoice.invoice_number, status: 'verified' } });
});

// ────────────────────────────────────────────────────────────────────────────
// Three-Way Match (PO / Receipt / Invoice reconciliation)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/three-way-match', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('three_way_match_results')
    .select(
      'id, match_status, quantity_variance, price_variance, amount_variance, purchase_order:purchase_orders(id,order_number), created_at',
      { count: 'exact' }
    )
    .eq('organization_id', user.organizationId);
  query = applyFilters(query, filters);
  const { data, count, error } = await query
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

  // 1. Verify receipt belongs to caller's org before querying items
  const { data: receiptCheck, error: receiptCheckErr } = await db
    .from('purchase_receipts')
    .select('id')
    .eq('id', purchase_receipt_id)
    .eq('organization_id', user.organizationId)
    .single();
  if (receiptCheckErr || !receiptCheck) throw ApiError.notFound('PurchaseReceipt', purchase_receipt_id, requestId);

  // 2. Look up PO, receipt items, and invoice in parallel
  const [poResult, receiptItemsResult, invoiceResult] = await Promise.all([
    db.from('purchase_orders')
      .select('id, total_amount')
      .eq('id', purchase_order_id)
      .eq('organization_id', user.organizationId)
      .is('deleted_at', null)
      .single(),
    db.from('purchase_receipt_items')
      .select('quantity, purchase_order_item_id')
      .eq('purchase_receipt_id', purchase_receipt_id),
    db.from('supplier_invoices')
      .select('id, total_amount')
      .eq('id', supplier_invoice_id)
      .eq('organization_id', user.organizationId)
      .is('deleted_at', null)
      .single(),
  ]);

  if (poResult.error || !poResult.data) throw ApiError.notFound('PurchaseOrder', purchase_order_id, requestId);
  if (receiptItemsResult.error) throw ApiError.database(receiptItemsResult.error.message, requestId);
  if (invoiceResult.error || !invoiceResult.data) throw ApiError.notFound('SupplierInvoice', supplier_invoice_id, requestId);

  const po = poResult.data;
  const receiptItems = receiptItemsResult.data;
  const invoice = invoiceResult.data;

  // 2. Look up PO item prices for receipt total calculation
  let receiptAmount = 0;
  if (receiptItems && receiptItems.length > 0) {
    const poItemIds = receiptItems
      .map((ri: { quantity: unknown; purchase_order_item_id: string }) => ri.purchase_order_item_id)
      .filter(Boolean);

    if (poItemIds.length > 0) {
      const { data: poItems } = await db
        .from('purchase_order_items')
        .select('id, unit_price')
        .in('id', poItemIds)
        .eq('organization_id', user.organizationId)
        .is('deleted_at', null);

      const priceMap = new Map(
        (poItems ?? []).map((pi: { id: string; unit_price: number }) => [pi.id, pi.unit_price ?? 0])
      );

      for (const ri of receiptItems) {
        const unitPrice = priceMap.get(ri.purchase_order_item_id) ?? 0;
        receiptAmount += (ri.quantity as number) * unitPrice;
      }
    }
  }

  const poAmount = po.total_amount ?? 0;
  const invoiceAmount = invoice.total_amount ?? 0;

  // 4. Calculate variance and determine match status
  const variance = Math.abs(poAmount - invoiceAmount) + Math.abs(poAmount - receiptAmount);
  let matchStatus: string;

  if (poAmount === receiptAmount && poAmount === invoiceAmount) {
    matchStatus = 'matched';
  } else if (Math.abs(poAmount - invoiceAmount) < 0.01 && Math.abs(poAmount - receiptAmount) < 0.01) {
    matchStatus = 'matched';
  } else if (poAmount === 0) {
    matchStatus = (invoiceAmount === 0 && receiptAmount === 0) ? 'matched' : 'mismatch';
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

// ────────────────────────────────────────────────────────────────────────────
// Advance Shipment Notices (ASN)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/advance-shipment-notices', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('advance_shipment_notices')
    .select(
      'id, asn_no, status, expected_date, remark, supplier:suppliers(id,name), warehouse:warehouses(id,name), purchase_order:purchase_orders!po_id(id,order_number), created_at',
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
procurementReceiving.get('/advance-shipment-notices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('advance_shipment_notices')
    .select('*, supplier:suppliers(id,name), warehouse:warehouses(id,name), purchase_order:purchase_orders!po_id(id,order_number), lines:asn_lines(id, line_number, quantity, lot_no, item:products!item_id(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('AdvanceShipmentNotice', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
procurementReceiving.post('/advance-shipment-notices', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'advance_shipment_notice',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate ASN number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'advance_shipment_notices',
      itemsTable: 'asn_lines',
      headerFk: 'asn_id',
      headerReturnSelect: 'id, asn_no, status',
      itemsReturnSelect: 'id, quantity, line_number',
    },
    {
      header: {
        ...headerFields,
        asn_no: seqData,
        organization_id: user.organizationId,
        status: 'open',
        created_by: user.userId,
      },
      items: (items ?? []).map((item: Record<string, unknown>, idx: number) => ({
        ...item,
        organization_id: user.organizationId,
        line_number: item.line_number ?? idx + 1,
      })),
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_asn', resource: 'advance_shipment_notices' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/advance-shipment-notices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'advance_shipment_notices',
      itemsTable: 'asn_lines',
      headerFk: 'asn_id',
      headerPermittedFields: ['status', 'expected_date', 'remark'],
      itemsReturnSelect: '*, item:products!item_id(id,name,code)',
      headerReturnSelect: 'id',
      softDeleteItems: true,
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['status', 'expected_date', 'remark']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('advance_shipment_notices')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('AdvanceShipmentNotice', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('advance_shipment_notices')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('AdvanceShipmentNotice', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/advance-shipment-notices/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'advance_shipment_notices', c.req.param('id'), user.organizationId, 'AdvanceShipmentNotice', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// ASN Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.route('', buildCrudRoutes({
  table: 'asn_lines',
  path: '/asn-lines',
  resourceName: 'AsnLine',
  listSelect: 'id, line_number, quantity, lot_no, item:products!item_id(id,name,code)',
  detailSelect: '*, item:products!item_id(id,name,code)',
  createReturnSelect: 'id, quantity, line_number',
  defaultSort: 'line_number',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'asn_id', parentTable: 'advance_shipment_notices' },
}));

// ────────────────────────────────────────────────────────────────────────────
// Reconciliation Statements (Supplier Account Reconciliation)
// ────────────────────────────────────────────────────────────────────────────

// GET list
procurementReceiving.get('/reconciliation-statements', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c);
  const filters = parseRefineFilters(c);

  let query = db
    .from('reconciliation_statements')
    .select(
      'id, statement_no, status, period_start, period_end, total_amount, paid_amount, currency, notes, supplier:suppliers(id,name), created_at',
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
procurementReceiving.get('/reconciliation-statements/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('reconciliation_statements')
    .select('*, supplier:suppliers(id,name), lines:reconciliation_lines(id, description, quantity, unit_price, line_amount, notes, item:products!item_id(id,name,code))')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('ReconciliationStatement', id, requestId);
  return c.json({ data });
});

// POST create (atomic header + items)
procurementReceiving.post('/reconciliation-statements', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'reconciliation_statement',
  });
  if (seqError || !seqData) throw ApiError.database(`Failed to generate statement number: ${seqError?.message ?? 'Sequence unavailable'}`, requestId);

  const { items, ...headerFields } = body;
  const result = await atomicCreateWithItems(
    db,
    {
      headerTable: 'reconciliation_statements',
      itemsTable: 'reconciliation_lines',
      headerFk: 'statement_id',
      headerReturnSelect: 'id, statement_no, status',
      itemsReturnSelect: 'id, line_amount',
    },
    {
      header: {
        ...headerFields,
        statement_no: seqData,
        organization_id: user.organizationId,
        status: 'draft',
      },
      items: items ?? [],
    },
    { userId: user.userId, organizationId: user.organizationId, requestId, action: 'create_reconciliation_statement', resource: 'reconciliation_statements' }
  );

  return c.json({ data: result.header }, 201);
});

// PUT update
procurementReceiving.put('/reconciliation-statements/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.items) {
    const updateConfig: AtomicUpdateConfig = {
      headerTable: 'reconciliation_statements',
      itemsTable: 'reconciliation_lines',
      headerFk: 'statement_id',
      headerPermittedFields: ['status', 'notes', 'paid_amount'],
      itemsReturnSelect: '*, item:products!item_id(id,name,code)',
      headerReturnSelect: 'id',
      autoSum: { headerField: 'total_amount', itemAmountExpr: (it) => Number(it.line_amount) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) },
    };
    const result = await atomicUpdateWithItems(db, updateConfig, id, user.organizationId, { header: body, items: body.items }, requestId);
    return c.json({ data: result.header });
  }

  const PERMITTED = new Set(['status', 'notes', 'paid_amount']);
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PERMITTED.has(k)) updateData[k] = v;
  }
  if (Object.keys(updateData).length === 0) {
    const { data: existing } = await db
      .from('reconciliation_statements')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single();
    if (!existing) throw ApiError.notFound('ReconciliationStatement', id, requestId);
    return c.json({ data: existing });
  }

  const { data, error } = await db
    .from('reconciliation_statements')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('ReconciliationStatement', id, requestId);
  return c.json({ data });
});

// DELETE (soft-delete)
procurementReceiving.delete('/reconciliation-statements/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  await performSoftDelete(db, 'reconciliation_statements', c.req.param('id'), user.organizationId, 'ReconciliationStatement', requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Reconciliation Lines — standalone CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

procurementReceiving.route('', buildCrudRoutes({
  table: 'reconciliation_lines',
  path: '/reconciliation-lines',
  resourceName: 'ReconciliationLine',
  listSelect: 'id, description, quantity, unit_price, line_amount, notes, item:products!item_id(id,name,code)',
  detailSelect: '*, item:products!item_id(id,name,code)',
  createReturnSelect: 'id, line_amount',
  defaultSort: 'id',
  softDelete: true,
  orgScoped: false,
  parentOwnership: { parentFk: 'statement_id', parentTable: 'reconciliation_statements' },
}));

export default procurementReceiving;
