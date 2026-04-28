/**
 * Shared P2P and O2C document flow helpers for seed scripts.
 * Both org1-flows.ts and org2-flows.ts delegate to these.
 */

import { SeedClient } from './client';

export interface P2PFlowOpts {
  supplier: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
  receivePercent: number;
  invoiceAfterReceipt: boolean;
  verifyInvoice: boolean;
  createPaymentRequest: boolean;
  approvePaymentRequest: boolean;
  warehouseId: string;
  orderDate: string;
  receiptDate: string;
  invoiceDate: string;
  dueDate: string;
}

export interface O2CFlowOpts {
  customer: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
  shipPercent: number;
  invoiceAfterShipment: boolean;
  issueInvoice: boolean;
  receiptPercent: number;
  warehouseId: string;
  orderDate: string;
  shipmentDate: string;
  carrier: string;
  invoiceDate: string;
  dueDate: string;
  receiptDate: string;
}

export async function p2pFlow(client: SeedClient, label: string, opts: P2PFlowOpts) {
  console.log(`  [P2P] ${label}`);

  const po = await client.post('/purchase-orders', {
    supplier_id: opts.supplier,
    order_date: opts.orderDate,
    warehouse_id: opts.warehouseId,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    PO created: ${po.order_number ?? po.id}`);

  await client.post(`/purchase-orders/${po.id}/submit`, {});
  await client.post(`/purchase-orders/${po.id}/approve`, {});
  console.log(`    PO approved`);

  if (opts.receivePercent === 0) return;

  const preview = await client.get(`/purchase-receipts/create-from/purchase-order/${po.id}`);
  const cleanedItems = preview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    quantity: Math.round(rest.quantity * opts.receivePercent),
  }));

  const receipt = await client.post('/purchase-receipts', {
    ...preview.header,
    receipt_date: opts.receiptDate,
    items: cleanedItems,
    _sourceRef: { type: 'purchase_order', id: po.id },
  });
  console.log(`    Receipt created: ${receipt.receipt_number ?? receipt.id}`);

  await client.post(`/purchase-receipts/${receipt.id}/confirm`, {});
  console.log(`    Receipt confirmed (stock-in done, PO status updated)`);

  if (!opts.invoiceAfterReceipt) return;

  const invPreview = await client.get(`/supplier-invoices/create-from/purchase-receipt/${receipt.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/supplier-invoices', {
    ...invPreview.header,
    invoice_date: opts.invoiceDate,
    due_date: opts.dueDate,
    items: invItems,
    _sourceRef: { type: 'purchase_receipt', id: receipt.id },
  });
  console.log(`    Supplier Invoice created: ${invoice.invoice_number ?? invoice.id}`);

  if (opts.verifyInvoice) {
    await client.post(`/supplier-invoices/${invoice.id}/verify`, {});
    console.log(`    Invoice verified`);
  }

  if (!opts.createPaymentRequest) return;

  const totalAmount = opts.items.reduce((sum, i) => sum + i.quantity * i.unit_price * opts.receivePercent, 0);
  const taxedAmount = Math.round(totalAmount * 1.13 * 100) / 100;
  const payReq = await client.post('/payment-requests', {
    supplier_id: opts.supplier,
    supplier_invoice_id: invoice.id,
    amount: taxedAmount,
    due_date: opts.dueDate,
    currency: 'CNY',
    payment_method: 'bank_transfer',
  });
  console.log(`    Payment Request created: ${payReq.request_number ?? payReq.id}`);

  if (opts.approvePaymentRequest) {
    await client.post(`/payment-requests/${payReq.id}/submit`, {});
    await client.post(`/payment-requests/${payReq.id}/approve`, {});
    console.log(`    Payment Request approved (ok_to_pay)`);
  }
}

export async function o2cFlow(client: SeedClient, label: string, opts: O2CFlowOpts) {
  console.log(`  [O2C] ${label}`);

  const so = await client.post('/sales-orders', {
    customer_id: opts.customer,
    order_date: opts.orderDate,
    warehouse_id: opts.warehouseId,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    SO created: ${so.order_number ?? so.id}`);

  await client.post(`/sales-orders/${so.id}/submit`, {});
  await client.post(`/sales-orders/${so.id}/approve`, {});
  console.log(`    SO approved`);

  if (opts.shipPercent === 0) return;

  const preview = await client.get(`/sales-shipments/create-from/sales-order/${so.id}`);
  const cleanedItems = preview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    quantity: Math.round(rest.quantity * opts.shipPercent),
  }));

  const shipment = await client.post('/sales-shipments', {
    ...preview.header,
    shipment_date: opts.shipmentDate,
    carrier: opts.carrier,
    tracking_number: `${opts.carrier.replace(/\s/g, '').slice(0, 3).toUpperCase()}${Date.now().toString().slice(-10)}`,
    items: cleanedItems,
    _sourceRef: { type: 'sales_order', id: so.id },
  });
  console.log(`    Shipment created: ${shipment.shipment_number ?? shipment.id}`);

  await client.post(`/sales-shipments/${shipment.id}/confirm`, {});
  console.log(`    Shipment confirmed (stock-out done, SO status updated)`);

  if (!opts.invoiceAfterShipment) return;

  const invPreview = await client.get(`/sales-invoices/create-from/sales-shipment/${shipment.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/sales-invoices', {
    ...invPreview.header,
    invoice_date: opts.invoiceDate,
    due_date: opts.dueDate,
    items: invItems,
    _sourceRef: { type: 'sales_shipment', id: shipment.id },
  });
  console.log(`    Sales Invoice created: ${invoice.invoice_number ?? invoice.id}`);

  if (opts.issueInvoice) {
    await client.post(`/sales-invoices/${invoice.id}/issue`, {});
    console.log(`    Invoice issued`);
  }

  if (opts.receiptPercent === 0) return;

  const invoiceTotal = opts.items.reduce(
    (sum, i) => sum + Math.round(i.quantity * opts.shipPercent) * i.unit_price * 1.13,
    0
  );
  const receiptAmount = Math.round(invoiceTotal * opts.receiptPercent * 100) / 100;

  await client.post('/customer-receipts', {
    customer_id: opts.customer,
    reference_type: 'sales_invoice',
    reference_id: invoice.id,
    amount: receiptAmount,
    receipt_date: opts.receiptDate,
    payment_method: 'bank_transfer',
  });
  console.log(`    Customer Receipt: ¥${receiptAmount} (SO payment_status auto-updated)`);
}
