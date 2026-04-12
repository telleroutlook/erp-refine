// scripts/seed/data/org2-transactions.ts
// Organization 2 (TECH) — Business document generators for 3 months (Jan-Mar 2026)

import type { IdRegistry } from '../id-registry';
import { pick, pickN, randomDate, randomInt, getShortHistoryMonths } from './shared';
import { org2ProductInfos } from './org2-master';

// ---------------------------------------------------------------------------
// Purchase Orders — 3 months, 4-6 per month
// ---------------------------------------------------------------------------

export function generateOrg2PurchaseOrders(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org2ProductInfos();
  const rawMaterials = products.filter((p) => p.type === 'material' || p.type === 'consumable');
  const supplierCodes = ['TS01', 'TS02', 'TS03', 'TS05'];
  const months = getShortHistoryMonths();
  const orders: Array<Record<string, unknown>> = [];

  for (const m of months) {
    const count = randomInt(4, 6);
    for (let i = 0; i < count; i++) {
      const supplierCode = pick(supplierCodes);
      const orderDate = randomDate(m.start, m.end);
      const itemCount = randomInt(1, 3);
      const selectedProducts = pickN(rawMaterials, itemCount);

      const isUsd = supplierCode === 'TS01' || supplierCode === 'TS03';
      const items = selectedProducts.map((prod) => {
        const qty = randomInt(10, 200);
        const unit_price = +(prod.costPrice * (0.95 + Math.random() * 0.1)).toFixed(2);
        return {
          product_id: reg.get('product', prod.code),
          quantity: qty,
          unit_price,
          tax_rate: isUsd ? 0 : 13,
          amount: +(qty * unit_price).toFixed(2),
        };
      });

      orders.push({
        supplier_id: reg.get('supplier', supplierCode),
        warehouse_id: reg.get('warehouse', 'TW-MAIN'),
        order_date: orderDate,
        expected_date: randomDate(new Date(orderDate), new Date(new Date(orderDate).getTime() + 21 * 86400000)),
        currency: isUsd ? 'USD' : 'CNY',
        payment_terms: pick([30, 45]),
        notes: `${m.label} procurement`,
        items,
        _month: m.label,
        _supplierCode: supplierCode,
      });
    }
  }
  return orders;
}

// ---------------------------------------------------------------------------
// Sales Orders — 3 months, 5-8 per month
// ---------------------------------------------------------------------------

export function generateOrg2SalesOrders(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org2ProductInfos();
  const finishedGoods = products.filter((p) => p.type === 'product');
  const customerCodes = ['TC01', 'TC02', 'TC03', 'TC04', 'TC05', 'TC06', 'TC07', 'TC08'];
  const months = getShortHistoryMonths();
  const orders: Array<Record<string, unknown>> = [];

  for (const m of months) {
    const count = randomInt(5, 8);
    for (let i = 0; i < count; i++) {
      const customerCode = pick(customerCodes);
      const orderDate = randomDate(m.start, m.end);
      const itemCount = randomInt(1, 3);
      const selectedProducts = pickN(finishedGoods, itemCount);

      const isUsd = ['TC02', 'TC04', 'TC06', 'TC08'].includes(customerCode);
      const items = selectedProducts.map((prod) => {
        const qty = randomInt(1, 15);
        const unit_price = +(prod.listPrice * (0.9 + Math.random() * 0.15)).toFixed(2);
        const discount_rate = pick([0, 0, 5, 10]);
        return {
          product_id: reg.get('product', prod.code),
          quantity: qty,
          unit_price,
          tax_rate: isUsd ? 0 : 13,
          discount_rate,
          amount: +(qty * unit_price * (1 - discount_rate / 100)).toFixed(2),
        };
      });

      orders.push({
        customer_id: reg.get('customer', customerCode),
        warehouse_id: reg.get('warehouse', isUsd ? 'TW-SHIP' : 'TW-MAIN'),
        order_date: orderDate,
        delivery_date: randomDate(new Date(orderDate), new Date(new Date(orderDate).getTime() + 21 * 86400000)),
        currency: isUsd ? 'USD' : 'CNY',
        payment_terms: isUsd ? 60 : 30,
        notes: `${m.label} sales`,
        items,
        _month: m.label,
        _customerCode: customerCode,
      });
    }
  }
  return orders;
}

// ---------------------------------------------------------------------------
// Opening Stock Balances
// ---------------------------------------------------------------------------

export function generateOrg2StockRecords(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org2ProductInfos();
  const records: Array<Record<string, unknown>> = [];

  for (const prod of products) {
    const qty = prod.type === 'material'
      ? randomInt(200, 1000)
      : prod.type === 'product'
        ? randomInt(10, 50)
        : randomInt(50, 150);
    const reserved = Math.floor(qty * Math.random() * 0.1);

    records.push({
      warehouse_id: reg.get('warehouse', 'TW-MAIN'),
      product_id: reg.get('product', prod.code),
      quantity: qty,
      reserved_quantity: reserved,
    });
  }
  return records;
}
