/**
 * Org2 (Tech Innovation Inc) seed flows — 3 P2P + 3 O2C flows.
 */

import { SeedClient } from './client';
import { p2pFlow, o2cFlow } from './flow-helpers';

// ─── Org2 Master Data IDs ───
const CUSTOMERS = {
  TC01: '9e4ec11f-c78e-41c8-8894-6365eaad6c7c',
  CUST_A: '89c7f735-d6ec-46a9-bb46-c4da3c33a02e',
};

const SUPPLIERS = {
  TS01: '136ec5ec-212f-4f27-82c6-a01a4a288bc0',
  SUP_D: 'e8e84d49-907b-4325-bfb9-edcb18629481',
};

const PRODUCTS = {
  'TE-CTL-001': '463d4bee-49fa-4c9b-8b4d-de35bfd821eb',
  'TE-GTW-001': '70284f68-a6a9-4baa-80ea-b407d2c1abb0',
  'TE-MCU-001': '44cb588d-312c-4244-88df-f00b9a43dd2f',
  'TE-CAB-001': '93d6e361-7f27-4206-9299-7ec1a9ef9c72',
};

const WAREHOUSES = {
  MAIN: 'd6433a08-2ca0-46e5-ba6f-9ee34a331243',
  SHIP: 'cdacc7c1-15c4-481a-a54f-43da6388f1c2',
};

const P2P_DEFAULTS = {
  warehouseId: WAREHOUSES.MAIN,
  orderDate: '2026-04-02',
  receiptDate: '2026-04-07',
  invoiceDate: '2026-04-10',
  dueDate: '2026-05-10',
} as const;

const O2C_DEFAULTS = {
  warehouseId: WAREHOUSES.SHIP,
  orderDate: '2026-04-02',
  shipmentDate: '2026-04-08',
  carrier: 'DHL',
  invoiceDate: '2026-04-12',
  dueDate: '2026-05-12',
  receiptDate: '2026-04-18',
} as const;

export async function seedOrg2(client: SeedClient) {
  console.log('\n  --- P2P Flows ---');

  await p2pFlow(client, '#1 Fully Closed', {
    ...P2P_DEFAULTS,
    supplier: SUPPLIERS.TS01,
    items: [
      { product_id: PRODUCTS['TE-MCU-001'], quantity: 500, unit_price: 45 },
      { product_id: PRODUCTS['TE-CAB-001'], quantity: 200, unit_price: 22 },
    ],
    receivePercent: 1,
    invoiceAfterReceipt: true,
    verifyInvoice: true,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  await p2pFlow(client, '#2 Partial Receipt (50%)', {
    ...P2P_DEFAULTS,
    supplier: SUPPLIERS.SUP_D,
    items: [
      { product_id: PRODUCTS['TE-MCU-001'], quantity: 300, unit_price: 45 },
    ],
    receivePercent: 0.5,
    invoiceAfterReceipt: false,
    verifyInvoice: false,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  await p2pFlow(client, '#3 Approved Only', {
    ...P2P_DEFAULTS,
    supplier: SUPPLIERS.TS01,
    items: [
      { product_id: PRODUCTS['TE-CAB-001'], quantity: 1000, unit_price: 22 },
    ],
    receivePercent: 0,
    invoiceAfterReceipt: false,
    verifyInvoice: false,
    createPaymentRequest: false,
    approvePaymentRequest: false,
  });

  console.log('\n  --- O2C Flows ---');

  await o2cFlow(client, '#1 Fully Closed', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.TC01,
    items: [
      { product_id: PRODUCTS['TE-CTL-001'], quantity: 10, unit_price: 1800 },
      { product_id: PRODUCTS['TE-GTW-001'], quantity: 20, unit_price: 1350 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 1,
  });

  await o2cFlow(client, '#2 Partial Receipt (50%)', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.CUST_A,
    items: [
      { product_id: PRODUCTS['TE-GTW-001'], quantity: 15, unit_price: 1350 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 0.5,
  });

  await o2cFlow(client, '#3 Approved Only', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.TC01,
    items: [
      { product_id: PRODUCTS['TE-CTL-001'], quantity: 5, unit_price: 1800 },
    ],
    shipPercent: 0,
    invoiceAfterShipment: false,
    issueInvoice: false,
    receiptPercent: 0,
  });

  console.log('\n  Org2 seed complete.');
}
