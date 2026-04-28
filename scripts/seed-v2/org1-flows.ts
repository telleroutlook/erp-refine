/**
 * Org1 (默认组织) seed flows — complete P2P and O2C document chains.
 *
 * Master data IDs (from DB):
 * - Customers: C001 上海华能电力集团, C002 中国石化, C003 宝山钢铁
 * - Suppliers: S001 宁波永信铝业, S002 太钢不锈钢, S003 昆山精密铸造
 * - Products (materials): RM-AL-001 铝合金板材(45), RM-ST-001 不锈钢管(32), RM-RB-001 NBR密封橡胶(120)
 * - Products (finished): FG-VLV-001 电磁阀DN25(520), FG-PMP-001 离心泵(3800), FG-FLT-001 过滤器(2100)
 * - Warehouses: WH-RAW 原材料仓库, WH-MAIN 主仓库, WH-FIN 成品仓库
 */

import { SeedClient } from './client';

// ─── Master Data IDs ───
const CUSTOMERS = {
  C001: 'c9b8369a-1a9f-41ad-86fe-a763bc8700c9', // 上海华能电力集团
  C002: '7c932a38-1e4c-4699-8542-4a1bb4a4f20c', // 中国石化上海分公司
  C003: '29643610-57fd-432b-9159-919e38bc0f1c', // 宝山钢铁
};

const SUPPLIERS = {
  S001: 'f2d77493-1d73-4dd8-bad7-d810218bf789', // 宁波永信铝业
  S002: '215e28c4-1327-4600-8cda-fe5d6774b675', // 太钢不锈钢
  S003: 'bdf6d841-cbd4-4cf8-8a72-a547709b1f78', // 昆山精密铸造
};

const PRODUCTS = {
  'RM-AL-001': 'ac7adeab-c0a2-4029-b2f4-631f5dd54593', // 铝合金板材 cost=45
  'RM-ST-001': 'f48ce1c4-ca58-4796-9a0e-6bbe0c4b139a', // 不锈钢管 cost=32
  'RM-RB-001': 'bf4ff0f3-8ee2-4815-883c-a18636432484', // NBR密封橡胶 cost=120
  'FG-VLV-001': '840943ec-f6f3-4b07-aa71-0dca2ef0eb96', // 电磁阀DN25 sell=520
  'FG-PMP-001': 'aa9ddb2d-7119-433c-84e7-09622fe8c9ad', // 离心泵CYZ-50 sell=3800
  'FG-FLT-001': '168bb661-fc07-43ad-8ea7-e30334c4651c', // 精密过滤器 sell=2100
};

const WAREHOUSES = {
  RAW: '3e0401ce-56f4-4a9d-a76d-c9318416d931',
  MAIN: 'a0d57e87-1761-4ed9-817d-cf0f07032123',
  FIN: '32c46ed2-f577-4741-bb86-e8564d4492f1',
};

// ─── Helper: run a full P2P flow ───
async function p2pFlow(
  client: SeedClient,
  label: string,
  opts: {
    supplier: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
    receivePercent: number; // 0 = skip receipt, 1 = full, 0.6 = partial
    invoiceAfterReceipt: boolean;
    verifyInvoice: boolean;
    createPaymentRequest: boolean;
    approvePaymentRequest: boolean;
  }
) {
  console.log(`  [P2P] ${label}`);

  // 1. Create PO
  const po = await client.post('/purchase-orders', {
    supplier_id: opts.supplier,
    order_date: '2026-04-01',
    warehouse_id: WAREHOUSES.RAW,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    PO created: ${po.order_number ?? po.id}`);

  // 2. Submit + Approve
  await client.post(`/purchase-orders/${po.id}/submit`, {});
  await client.post(`/purchase-orders/${po.id}/approve`, {});
  console.log(`    PO approved`);

  if (opts.receivePercent === 0) return;

  // 3. Create Receipt (from PO)
  const preview = await client.get(`/purchase-receipts/create-from/purchase-order/${po.id}`);
  const receiptItems = preview.items.map((item: any) => ({
    ...item,
    quantity: Math.round(item._open_quantity * opts.receivePercent),
  }));
  // Remove preview-only fields
  const cleanedItems = receiptItems.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => rest);

  const receipt = await client.post('/purchase-receipts', {
    ...preview.header,
    receipt_date: '2026-04-05',
    items: cleanedItems,
    _sourceRef: { type: 'purchase_order', id: po.id },
  });
  console.log(`    Receipt created: ${receipt.receipt_number ?? receipt.id}`);

  // 4. Confirm receipt (triggers stock-in + PO status update)
  await client.post(`/purchase-receipts/${receipt.id}/confirm`, {});
  console.log(`    Receipt confirmed (stock-in done, PO status updated)`);

  if (!opts.invoiceAfterReceipt) return;

  // 5. Create Supplier Invoice (from Receipt)
  const invPreview = await client.get(`/supplier-invoices/create-from/purchase-receipt/${receipt.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/supplier-invoices', {
    ...invPreview.header,
    invoice_date: '2026-04-08',
    due_date: '2026-05-08',
    items: invItems,
    _sourceRef: { type: 'purchase_receipt', id: receipt.id },
  });
  console.log(`    Supplier Invoice created: ${invoice.invoice_number ?? invoice.id}`);

  // 6. Verify invoice (triggers invoiced_qty update on PO items)
  if (opts.verifyInvoice) {
    await client.post(`/supplier-invoices/${invoice.id}/verify`, {});
    console.log(`    Invoice verified (invoiced_qty updated)`);
  }

  if (!opts.createPaymentRequest) return;

  // 7. Create Payment Request
  const totalAmount = opts.items.reduce((sum, i) => sum + i.quantity * i.unit_price * opts.receivePercent, 0);
  const taxedAmount = Math.round(totalAmount * 1.13 * 100) / 100;
  const payReq = await client.post('/payment-requests', {
    supplier_id: opts.supplier,
    supplier_invoice_id: invoice.id,
    amount: taxedAmount,
    due_date: '2026-05-08',
    currency: 'CNY',
    payment_method: 'bank_transfer',
  });
  console.log(`    Payment Request created: ${payReq.request_number ?? payReq.id}`);

  // 8. Submit + Approve payment request
  if (opts.approvePaymentRequest) {
    await client.post(`/payment-requests/${payReq.id}/submit`, {});
    await client.post(`/payment-requests/${payReq.id}/approve`, {});
    console.log(`    Payment Request approved (ok_to_pay)`);
  }
}

// ─── Helper: run a full O2C flow ───
async function o2cFlow(
  client: SeedClient,
  label: string,
  opts: {
    customer: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
    shipPercent: number; // 0 = skip, 1 = full
    invoiceAfterShipment: boolean;
    issueInvoice: boolean;
    receiptPercent: number; // 0 = skip, 0.5 = partial, 1 = full
  }
) {
  console.log(`  [O2C] ${label}`);

  // 1. Create SO
  const so = await client.post('/sales-orders', {
    customer_id: opts.customer,
    order_date: '2026-04-01',
    warehouse_id: WAREHOUSES.FIN,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    SO created: ${so.order_number ?? so.id}`);

  // 2. Submit + Approve
  await client.post(`/sales-orders/${so.id}/submit`, {});
  await client.post(`/sales-orders/${so.id}/approve`, {});
  console.log(`    SO approved`);

  if (opts.shipPercent === 0) return;

  // 3. Create Shipment (from SO)
  const preview = await client.get(`/sales-shipments/create-from/sales-order/${so.id}`);
  const shipItems = preview.items.map((item: any) => ({
    ...item,
    quantity: Math.round(item._open_quantity * opts.shipPercent),
  }));
  const cleanedItems = shipItems.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => rest);

  const shipment = await client.post('/sales-shipments', {
    ...preview.header,
    shipment_date: '2026-04-06',
    carrier: '顺丰速运',
    tracking_number: `SF${Date.now().toString().slice(-10)}`,
    items: cleanedItems,
    _sourceRef: { type: 'sales_order', id: so.id },
  });
  console.log(`    Shipment created: ${shipment.shipment_number ?? shipment.id}`);

  // 4. Confirm shipment (triggers stock-out + SO status update)
  await client.post(`/sales-shipments/${shipment.id}/confirm`, {});
  console.log(`    Shipment confirmed (stock-out done, SO status updated)`);

  if (!opts.invoiceAfterShipment) return;

  // 5. Create Sales Invoice (from Shipment)
  const invPreview = await client.get(`/sales-invoices/create-from/sales-shipment/${shipment.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/sales-invoices', {
    ...invPreview.header,
    invoice_date: '2026-04-10',
    due_date: '2026-05-10',
    items: invItems,
    _sourceRef: { type: 'sales_shipment', id: shipment.id },
  });
  console.log(`    Sales Invoice created: ${invoice.invoice_number ?? invoice.id}`);

  // 6. Issue invoice (triggers invoiced_qty update)
  if (opts.issueInvoice) {
    await client.post(`/sales-invoices/${invoice.id}/issue`, {});
    console.log(`    Invoice issued (invoiced_qty updated)`);
  }

  if (opts.receiptPercent === 0) return;

  // 7. Create Customer Receipt
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
    receipt_date: '2026-04-15',
    payment_method: 'bank_transfer',
  });
  console.log(`    Customer Receipt: ¥${receiptAmount} (SO payment_status auto-updated)`);
}

// ─── Main Org1 Seed ───
export async function seedOrg1P2P(client: SeedClient) {
  console.log('\n  --- P2P Flows ---');

  // P2P-1: Fully closed (PO → Receipt → Invoice → Verify → Payment approved)
  await p2pFlow(client, '#1 Fully Closed', {
    supplier: SUPPLIERS.S001,
    items: [
      { product_id: PRODUCTS['RM-AL-001'], quantity: 100, unit_price: 45 },
      { product_id: PRODUCTS['RM-ST-001'], quantity: 200, unit_price: 32 },
    ],
    receivePercent: 1,
    invoiceAfterReceipt: true,
    verifyInvoice: true,
    createPaymentRequest: true,
    approvePaymentRequest: true,
  });

  // P2P-2: Invoiced but unpaid
  await p2pFlow(client, '#2 Invoiced Unpaid', {
    supplier: SUPPLIERS.S002,
    items: [
      { product_id: PRODUCTS['RM-ST-001'], quantity: 150, unit_price: 32 },
      { product_id: PRODUCTS['RM-RB-001'], quantity: 50, unit_price: 120 },
    ],
    receivePercent: 1,
    invoiceAfterReceipt: true,
    verifyInvoice: true,
    createPaymentRequest: true,
    approvePaymentRequest: false,
  });

  // P2P-3: Partial receipt + partial invoice
  await p2pFlow(client, '#3 Partial (60%)', {
    supplier: SUPPLIERS.S003,
    items: [
      { product_id: PRODUCTS['RM-AL-001'], quantity: 200, unit_price: 45 },
    ],
    receivePercent: 0.6,
    invoiceAfterReceipt: true,
    verifyInvoice: true,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  // P2P-4: Received but not invoiced
  await p2pFlow(client, '#4 Received No Invoice', {
    supplier: SUPPLIERS.S001,
    items: [
      { product_id: PRODUCTS['RM-RB-001'], quantity: 80, unit_price: 120 },
    ],
    receivePercent: 1,
    invoiceAfterReceipt: false,
    verifyInvoice: false,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  // P2P-5: Approved but not received
  await p2pFlow(client, '#5 Approved Only', {
    supplier: SUPPLIERS.S002,
    items: [
      { product_id: PRODUCTS['RM-AL-001'], quantity: 300, unit_price: 45 },
      { product_id: PRODUCTS['RM-ST-001'], quantity: 100, unit_price: 32 },
    ],
    receivePercent: 0,
    invoiceAfterReceipt: false,
    verifyInvoice: false,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  // P2P-6: Partial receipt (40%)
  await p2pFlow(client, '#6 Partial Receipt (40%)', {
    supplier: SUPPLIERS.S003,
    items: [
      { product_id: PRODUCTS['RM-ST-001'], quantity: 500, unit_price: 32 },
    ],
    receivePercent: 0.4,
    invoiceAfterReceipt: false,
    verifyInvoice: false,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  console.log('\n  Org1 P2P seed complete.');
}

export async function seedOrg1O2C(client: SeedClient) {
  console.log('\n  --- O2C Flows ---');

  // O2C-1: Fully closed (SO → Ship → Invoice → Issue → Full Receipt)
  await o2cFlow(client, '#1 Fully Closed', {
    customer: CUSTOMERS.C001,
    items: [
      { product_id: PRODUCTS['FG-VLV-001'], quantity: 20, unit_price: 520 },
      { product_id: PRODUCTS['FG-FLT-001'], quantity: 10, unit_price: 2100 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 1,
  });

  // O2C-2: Partial receipt (50%)
  await o2cFlow(client, '#2 Partial Receipt (50%)', {
    customer: CUSTOMERS.C002,
    items: [
      { product_id: PRODUCTS['FG-PMP-001'], quantity: 5, unit_price: 3800 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 0.5,
  });

  // O2C-3: Partial shipment (70%) + invoiced
  await o2cFlow(client, '#3 Partial Ship (70%) + Invoiced', {
    customer: CUSTOMERS.C003,
    items: [
      { product_id: PRODUCTS['FG-VLV-001'], quantity: 50, unit_price: 520 },
    ],
    shipPercent: 0.7,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 0,
  });

  // O2C-4: Shipped but not invoiced
  await o2cFlow(client, '#4 Shipped No Invoice', {
    customer: CUSTOMERS.C001,
    items: [
      { product_id: PRODUCTS['FG-FLT-001'], quantity: 15, unit_price: 2100 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: false,
    issueInvoice: false,
    receiptPercent: 0,
  });

  // O2C-5: Approved but not shipped
  await o2cFlow(client, '#5 Approved Only', {
    customer: CUSTOMERS.C002,
    items: [
      { product_id: PRODUCTS['FG-PMP-001'], quantity: 8, unit_price: 3800 },
      { product_id: PRODUCTS['FG-VLV-001'], quantity: 30, unit_price: 520 },
    ],
    shipPercent: 0,
    invoiceAfterShipment: false,
    issueInvoice: false,
    receiptPercent: 0,
  });

  // O2C-6: Partial shipment (50%)
  await o2cFlow(client, '#6 Partial Ship (50%)', {
    customer: CUSTOMERS.C003,
    items: [
      { product_id: PRODUCTS['FG-FLT-001'], quantity: 20, unit_price: 2100 },
    ],
    shipPercent: 0.5,
    invoiceAfterShipment: false,
    issueInvoice: false,
    receiptPercent: 0,
  });

  console.log('\n  Org1 O2C seed complete.');
}
