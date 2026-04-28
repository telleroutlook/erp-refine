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
import { p2pFlow, o2cFlow } from './flow-helpers';

// ─── Master Data IDs ───
const CUSTOMERS = {
  C001: 'c9b8369a-1a9f-41ad-86fe-a763bc8700c9',
  C002: '7c932a38-1e4c-4699-8542-4a1bb4a4f20c',
  C003: '29643610-57fd-432b-9159-919e38bc0f1c',
};

const SUPPLIERS = {
  S001: 'f2d77493-1d73-4dd8-bad7-d810218bf789',
  S002: '215e28c4-1327-4600-8cda-fe5d6774b675',
  S003: 'bdf6d841-cbd4-4cf8-8a72-a547709b1f78',
};

const PRODUCTS = {
  'RM-AL-001': 'ac7adeab-c0a2-4029-b2f4-631f5dd54593',
  'RM-ST-001': 'f48ce1c4-ca58-4796-9a0e-6bbe0c4b139a',
  'RM-RB-001': 'bf4ff0f3-8ee2-4815-883c-a18636432484',
  'FG-VLV-001': '840943ec-f6f3-4b07-aa71-0dca2ef0eb96',
  'FG-PMP-001': 'aa9ddb2d-7119-433c-84e7-09622fe8c9ad',
  'FG-FLT-001': '168bb661-fc07-43ad-8ea7-e30334c4651c',
};

const WAREHOUSES = {
  RAW: '3e0401ce-56f4-4a9d-a76d-c9318416d931',
  MAIN: 'a0d57e87-1761-4ed9-817d-cf0f07032123',
  FIN: '32c46ed2-f577-4741-bb86-e8564d4492f1',
};

const P2P_DEFAULTS = {
  warehouseId: WAREHOUSES.RAW,
  orderDate: '2026-04-01',
  receiptDate: '2026-04-05',
  invoiceDate: '2026-04-08',
  dueDate: '2026-05-08',
} as const;

const O2C_DEFAULTS = {
  warehouseId: WAREHOUSES.FIN,
  orderDate: '2026-04-01',
  shipmentDate: '2026-04-06',
  carrier: '顺丰速运',
  invoiceDate: '2026-04-10',
  dueDate: '2026-05-10',
  receiptDate: '2026-04-15',
} as const;

// ─── Main Org1 Seed ───
export async function seedOrg1P2P(client: SeedClient) {
  console.log('\n  --- P2P Flows ---');

  await p2pFlow(client, '#1 Fully Closed', {
    ...P2P_DEFAULTS,
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

  await p2pFlow(client, '#2 Invoiced Unpaid', {
    ...P2P_DEFAULTS,
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

  await p2pFlow(client, '#3 Partial (60%)', {
    ...P2P_DEFAULTS,
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

  await p2pFlow(client, '#4 Received No Invoice', {
    ...P2P_DEFAULTS,
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

  await p2pFlow(client, '#5 Approved Only', {
    ...P2P_DEFAULTS,
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

  await p2pFlow(client, '#6 Partial Receipt (40%)', {
    ...P2P_DEFAULTS,
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

  await o2cFlow(client, '#1 Fully Closed', {
    ...O2C_DEFAULTS,
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

  await o2cFlow(client, '#2 Partial Receipt (50%)', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.C002,
    items: [
      { product_id: PRODUCTS['FG-PMP-001'], quantity: 5, unit_price: 3800 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 0.5,
  });

  await o2cFlow(client, '#3 Partial Ship (70%) + Invoiced', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.C003,
    items: [
      { product_id: PRODUCTS['FG-VLV-001'], quantity: 50, unit_price: 520 },
    ],
    shipPercent: 0.7,
    invoiceAfterShipment: true,
    issueInvoice: true,
    receiptPercent: 0,
  });

  await o2cFlow(client, '#4 Shipped No Invoice', {
    ...O2C_DEFAULTS,
    customer: CUSTOMERS.C001,
    items: [
      { product_id: PRODUCTS['FG-FLT-001'], quantity: 15, unit_price: 2100 },
    ],
    shipPercent: 1,
    invoiceAfterShipment: false,
    issueInvoice: false,
    receiptPercent: 0,
  });

  await o2cFlow(client, '#5 Approved Only', {
    ...O2C_DEFAULTS,
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

  await o2cFlow(client, '#6 Partial Ship (50%)', {
    ...O2C_DEFAULTS,
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
