/**
 * Org2 (Tech Innovation Inc) seed flows — 3 P2P + 3 O2C flows.
 */

import { SeedClient } from './client';

// ─── Org2 Master Data IDs ───
const CUSTOMERS = {
  TC01: '9e4ec11f-c78e-41c8-8894-6365eaad6c7c', // Shenzhen Smart Systems
  CUST_A: '89c7f735-d6ec-46a9-bb46-c4da3c33a02e', // 客户Alpha-T
};

const SUPPLIERS = {
  TS01: '136ec5ec-212f-4f27-82c6-a01a4a288bc0', // Texas Instruments China
  SUP_D: 'e8e84d49-907b-4325-bfb9-edcb18629481', // 供应商Delta-T
};

const PRODUCTS = {
  'TE-CTL-001': '463d4bee-49fa-4c9b-8b4d-de35bfd821eb', // PLC Controller cost=1200 sell=1800
  'TE-GTW-001': '70284f68-a6a9-4baa-80ea-b407d2c1abb0', // IoT Gateway cost=850 sell=1350
  'TE-MCU-001': '44cb588d-312c-4244-88df-f00b9a43dd2f', // ARM Cortex M4 cost=45
  'TE-CAB-001': '93d6e361-7f27-4206-9299-7ec1a9ef9c72', // Industrial Cable cost=22
};

const WAREHOUSES = {
  MAIN: 'd6433a08-2ca0-46e5-ba6f-9ee34a331243', // Main Warehouse
  SHIP: 'cdacc7c1-15c4-481a-a54f-43da6388f1c2', // Shipping Hub
};

// Reuse the same flow helpers pattern as org1
async function p2pFlow(client: SeedClient, label: string, opts: any) {
  console.log(`  [P2P] ${label}`);

  const po = await client.post('/purchase-orders', {
    supplier_id: opts.supplier,
    order_date: '2026-04-02',
    warehouse_id: WAREHOUSES.MAIN,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    PO created: ${po.order_number ?? po.id}`);

  await client.post(`/purchase-orders/${po.id}/submit`, {});
  await client.post(`/purchase-orders/${po.id}/approve`, {});

  if (opts.receivePercent === 0) return;

  const preview = await client.get(`/purchase-receipts/create-from/purchase-order/${po.id}`);
  const cleanedItems = preview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    quantity: Math.round(rest.quantity * opts.receivePercent),
  }));

  const receipt = await client.post('/purchase-receipts', {
    ...preview.header,
    receipt_date: '2026-04-07',
    items: cleanedItems,
    _sourceRef: { type: 'purchase_order', id: po.id },
  });

  await client.post(`/purchase-receipts/${receipt.id}/confirm`, {});
  console.log(`    Receipt confirmed`);

  if (!opts.invoice) return;

  const invPreview = await client.get(`/supplier-invoices/create-from/purchase-receipt/${receipt.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/supplier-invoices', {
    ...invPreview.header,
    invoice_date: '2026-04-10',
    due_date: '2026-05-10',
    items: invItems,
    _sourceRef: { type: 'purchase_receipt', id: receipt.id },
  });

  await client.post(`/supplier-invoices/${invoice.id}/verify`, {});
  console.log(`    Invoice verified`);
}

async function o2cFlow(client: SeedClient, label: string, opts: any) {
  console.log(`  [O2C] ${label}`);

  const so = await client.post('/sales-orders', {
    customer_id: opts.customer,
    order_date: '2026-04-02',
    warehouse_id: WAREHOUSES.SHIP,
    currency: 'CNY',
    payment_terms: 30,
    items: opts.items,
  });
  console.log(`    SO created: ${so.order_number ?? so.id}`);

  await client.post(`/sales-orders/${so.id}/submit`, {});
  await client.post(`/sales-orders/${so.id}/approve`, {});

  if (opts.shipPercent === 0) return;

  const preview = await client.get(`/sales-shipments/create-from/sales-order/${so.id}`);
  const cleanedItems = preview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    quantity: Math.round(rest.quantity * opts.shipPercent),
  }));

  const shipment = await client.post('/sales-shipments', {
    ...preview.header,
    shipment_date: '2026-04-08',
    carrier: 'DHL',
    tracking_number: `DHL${Date.now().toString().slice(-10)}`,
    items: cleanedItems,
    _sourceRef: { type: 'sales_order', id: so.id },
  });

  await client.post(`/sales-shipments/${shipment.id}/confirm`, {});
  console.log(`    Shipment confirmed`);

  if (!opts.invoice) return;

  const invPreview = await client.get(`/sales-invoices/create-from/sales-shipment/${shipment.id}`);
  const invItems = invPreview.items.map(({ _open_quantity, _source_item_id, _product, ...rest }: any) => ({
    ...rest,
    tax_rate: 13,
  }));

  const invoice = await client.post('/sales-invoices', {
    ...invPreview.header,
    invoice_date: '2026-04-12',
    due_date: '2026-05-12',
    items: invItems,
    _sourceRef: { type: 'sales_shipment', id: shipment.id },
  });

  await client.post(`/sales-invoices/${invoice.id}/issue`, {});
  console.log(`    Invoice issued`);

  if (opts.receiptPercent === 0) return;

  const invoiceTotal = opts.items.reduce(
    (sum: number, i: any) => sum + Math.round(i.quantity * opts.shipPercent) * i.unit_price * 1.13,
    0
  );
  const receiptAmount = Math.round(invoiceTotal * opts.receiptPercent * 100) / 100;

  await client.post('/customer-receipts', {
    customer_id: opts.customer,
    reference_type: 'sales_invoice',
    reference_id: invoice.id,
    amount: receiptAmount,
    receipt_date: '2026-04-18',
    payment_method: 'bank_transfer',
  });
  console.log(`    Receipt: ¥${receiptAmount}`);
}

export async function seedOrg2(client: SeedClient) {
  console.log('\n  --- P2P Flows ---');

  // P2P-1: Fully closed
  await p2pFlow(client, '#1 Fully Closed', {
    supplier: SUPPLIERS.TS01,
    items: [
      { product_id: PRODUCTS['TE-MCU-001'], quantity: 500, unit_price: 45 },
      { product_id: PRODUCTS['TE-CAB-001'], quantity: 200, unit_price: 22 },
    ],
    receivePercent: 1,
    invoice: true,
  });

  // P2P-2: Partial receipt (50%)
  await p2pFlow(client, '#2 Partial Receipt (50%)', {
    supplier: SUPPLIERS.SUP_D,
    items: [
      { product_id: PRODUCTS['TE-MCU-001'], quantity: 300, unit_price: 45 },
    ],
    receivePercent: 0.5,
    invoice: false,
  });

  // P2P-3: Approved only
  await p2pFlow(client, '#3 Approved Only', {
    supplier: SUPPLIERS.TS01,
    items: [
      { product_id: PRODUCTS['TE-CAB-001'], quantity: 1000, unit_price: 22 },
    ],
    receivePercent: 0,
    invoice: false,
  });

  console.log('\n  --- O2C Flows ---');

  // O2C-1: Fully closed
  await o2cFlow(client, '#1 Fully Closed', {
    customer: CUSTOMERS.TC01,
    items: [
      { product_id: PRODUCTS['TE-CTL-001'], quantity: 10, unit_price: 1800 },
      { product_id: PRODUCTS['TE-GTW-001'], quantity: 20, unit_price: 1350 },
    ],
    shipPercent: 1,
    invoice: true,
    receiptPercent: 1,
  });

  // O2C-2: Partial receipt
  await o2cFlow(client, '#2 Partial Receipt (50%)', {
    customer: CUSTOMERS.CUST_A,
    items: [
      { product_id: PRODUCTS['TE-GTW-001'], quantity: 15, unit_price: 1350 },
    ],
    shipPercent: 1,
    invoice: true,
    receiptPercent: 0.5,
  });

  // O2C-3: Approved only
  await o2cFlow(client, '#3 Approved Only', {
    customer: CUSTOMERS.TC01,
    items: [
      { product_id: PRODUCTS['TE-CTL-001'], quantity: 5, unit_price: 1800 },
    ],
    shipPercent: 0,
    invoice: false,
    receiptPercent: 0,
  });

  console.log('\n  Org2 seed complete.');
}
