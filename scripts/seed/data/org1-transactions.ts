// scripts/seed/data/org1-transactions.ts
// Organization 1 (DEFAULT) — Business document generators for 6 months of history
// Generates POs, SOs, and supporting documents with proper ID-based references

import type { IdRegistry } from '../id-registry';
import type { ProductInfo } from '../types';
import { pick, pickN, randomDate, randomAmount, randomInt, getHistoryMonths } from './shared';
import { org1ProductInfos } from './org1-master';

// ---------------------------------------------------------------------------
// Purchase Orders — 6 months, 8-12 per month
// ---------------------------------------------------------------------------

export function generateOrg1PurchaseOrders(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org1ProductInfos();
  const rawMaterials = products.filter((p) => p.type === 'material' || p.type === 'consumable');
  const supplierCodes = ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007', 'S009', 'S010'];
  const warehouseCodes = ['WH-MAIN', 'WH-RAW'];
  const months = getHistoryMonths();
  const orders: Array<Record<string, unknown>> = [];

  for (const m of months) {
    const count = randomInt(8, 12);
    for (let i = 0; i < count; i++) {
      const supplierCode = pick(supplierCodes);
      const warehouseCode = pick(warehouseCodes);
      const orderDate = randomDate(m.start, m.end);
      const itemCount = randomInt(1, 4);
      const selectedProducts = pickN(rawMaterials, itemCount);

      const items = selectedProducts.map((prod) => {
        const qty = randomInt(5, 100) * 10;
        const unit_price = +(prod.costPrice * (0.95 + Math.random() * 0.1)).toFixed(2);
        return {
          product_id: reg.get('product', prod.code),
          qty,
          unit_price,
          tax_rate: 13,
          amount: +(qty * unit_price).toFixed(2),
        };
      });

      orders.push({
        supplier_id: reg.get('supplier', supplierCode),
        warehouse_id: reg.get('warehouse', warehouseCode),
        order_date: orderDate,
        expected_date: randomDate(new Date(orderDate), new Date(new Date(orderDate).getTime() + 30 * 86400000)),
        currency: supplierCode === 'S009' ? 'USD' : 'CNY',
        payment_terms: pick([15, 30, 45, 60]),
        notes: `${m.label} 采购`,
        items,
        _month: m.label,
        _supplierCode: supplierCode,
      });
    }
  }
  return orders;
}

// ---------------------------------------------------------------------------
// Sales Orders — 6 months, 10-17 per month
// ---------------------------------------------------------------------------

export function generateOrg1SalesOrders(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org1ProductInfos();
  const finishedGoods = products.filter((p) => p.type === 'product');
  const customerCodes = ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008', 'C009', 'C010', 'C011', 'C012', 'C013', 'C014', 'C015'];
  const warehouseCodes = ['WH-MAIN', 'WH-FIN'];
  const months = getHistoryMonths();
  const orders: Array<Record<string, unknown>> = [];

  for (const m of months) {
    const count = randomInt(10, 17);
    for (let i = 0; i < count; i++) {
      const customerCode = pick(customerCodes);
      const warehouseCode = pick(warehouseCodes);
      const orderDate = randomDate(m.start, m.end);
      const itemCount = randomInt(1, 3);
      const selectedProducts = pickN(finishedGoods, itemCount);

      const items = selectedProducts.map((prod) => {
        const qty = randomInt(1, 20);
        const unit_price = +(prod.listPrice * (0.9 + Math.random() * 0.15)).toFixed(2);
        const discount_rate = pick([0, 0, 0, 5, 10, 15]);
        return {
          product_id: reg.get('product', prod.code),
          qty,
          unit_price,
          tax_rate: 13,
          discount_rate,
          amount: +(qty * unit_price * (1 - discount_rate / 100)).toFixed(2),
        };
      });

      const isUsd = customerCode === 'C013' || customerCode === 'C014';
      orders.push({
        customer_id: reg.get('customer', customerCode),
        warehouse_id: reg.get('warehouse', warehouseCode),
        order_date: orderDate,
        delivery_date: randomDate(new Date(orderDate), new Date(new Date(orderDate).getTime() + 30 * 86400000)),
        currency: isUsd ? 'USD' : 'CNY',
        payment_terms: pick([15, 30, 45, 60]),
        notes: `${m.label} 销售`,
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

export function generateOrg1StockRecords(reg: IdRegistry): Array<Record<string, unknown>> {
  const products = org1ProductInfos();
  const warehouseCodes = ['WH-MAIN', 'WH-RAW', 'WH-FIN'];
  const records: Array<Record<string, unknown>> = [];

  for (const whCode of warehouseCodes) {
    for (const prod of products) {
      // Only raw materials in RAW warehouse, only finished goods in FIN
      if (whCode === 'WH-RAW' && prod.type !== 'material') continue;
      if (whCode === 'WH-FIN' && prod.type !== 'product' && prod.type !== 'semi_finished') continue;
      if (whCode === 'WH-MAIN' && prod.type === 'material') continue; // materials go to WH-RAW

      const qty = prod.type === 'material'
        ? randomInt(500, 2500)
        : prod.type === 'product'
          ? randomInt(20, 100)
          : randomInt(50, 200);
      const reserved = Math.floor(qty * Math.random() * 0.15);

      records.push({
        warehouse_id: reg.get('warehouse', whCode),
        product_id: reg.get('product', prod.code),
        quantity: qty,
        reserved_quantity: reserved,
      });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// BOM Definitions for finished goods
// ---------------------------------------------------------------------------

export function generateOrg1BOMs(reg: IdRegistry): Array<Record<string, unknown>> {
  return [
    {
      product_id: reg.get('product', 'FG-VLV-001'),
      notes: '工业电磁阀 DN25 BOM',
      version: 1,
      quantity: 1,
      is_active: true,
      items: [
        { product_id: reg.get('product', 'RM-AL-001'), qty: 2, uom: 'KG', scrap_rate: 5 },
        { product_id: reg.get('product', 'RM-ST-001'), qty: 0.5, uom: 'M', scrap_rate: 3 },
        { product_id: reg.get('product', 'RM-RB-001'), qty: 0.3, uom: 'KG', scrap_rate: 2 },
        { product_id: reg.get('product', 'SF-PCB-001'), qty: 1, uom: 'PCS', scrap_rate: 1 },
      ],
    },
    {
      product_id: reg.get('product', 'FG-PMP-001'),
      notes: '离心泵 CYZ-50 BOM',
      version: 1,
      quantity: 1,
      is_active: true,
      items: [
        { product_id: reg.get('product', 'RM-ST-002'), qty: 8, uom: 'KG', scrap_rate: 5 },
        { product_id: reg.get('product', 'RM-CU-001'), qty: 1.5, uom: 'KG', scrap_rate: 3 },
        { product_id: reg.get('product', 'SF-FR-001'), qty: 1, uom: 'PCS', scrap_rate: 0 },
        { product_id: reg.get('product', 'SF-SH-001'), qty: 1, uom: 'PCS', scrap_rate: 0 },
        { product_id: reg.get('product', 'SF-PCB-001'), qty: 1, uom: 'PCS', scrap_rate: 1 },
      ],
    },
    {
      product_id: reg.get('product', 'FG-FLT-001'),
      notes: '精密过滤器 PF-100 BOM',
      version: 1,
      quantity: 1,
      is_active: true,
      items: [
        { product_id: reg.get('product', 'RM-ST-001'), qty: 2, uom: 'M', scrap_rate: 5 },
        { product_id: reg.get('product', 'RM-PL-001'), qty: 1.5, uom: 'KG', scrap_rate: 3 },
        { product_id: reg.get('product', 'RM-RB-001'), qty: 0.2, uom: 'KG', scrap_rate: 2 },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export function generateOrg1Contracts(reg: IdRegistry): Array<Record<string, unknown>> {
  return [
    {
      contract_type: 'sales',
      customer_id: reg.get('customer', 'C002'),
      description: '中国石化年度阀门采购框架协议',
      start_date: '2025-10-01',
      end_date: '2026-09-30',
      total_amount: 2000000,
      currency: 'CNY',
      status: 'active',
      payment_terms: 45,
      items: [
        { product_id: reg.get('product', 'FG-VLV-001'), qty: 200, unit_price: 500, amount: 100000 },
        { product_id: reg.get('product', 'FG-VLV-002'), qty: 100, unit_price: 750, amount: 75000 },
      ],
    },
    {
      contract_type: 'sales',
      customer_id: reg.get('customer', 'C003'),
      description: '宝钢设备维保服务合同',
      start_date: '2025-10-01',
      end_date: '2026-09-30',
      total_amount: 500000,
      currency: 'CNY',
      status: 'active',
      payment_terms: 30,
      items: [
        { description: '季度设备巡检维保', qty: 4, unit_price: 50000, amount: 200000 },
        { description: '备件供应', qty: 1, unit_price: 300000, amount: 300000 },
      ],
    },
    {
      contract_type: 'purchase',
      supplier_id: reg.get('supplier', 'S001'),
      description: '永信铝业原材料供应合同',
      start_date: '2025-10-01',
      end_date: '2026-03-31',
      total_amount: 800000,
      currency: 'CNY',
      status: 'active',
      payment_terms: 30,
      items: [
        { product_id: reg.get('product', 'RM-AL-001'), qty: 10000, unit_price: 44, amount: 440000 },
        { product_id: reg.get('product', 'RM-AL-002'), qty: 5000, unit_price: 67, amount: 335000 },
      ],
    },
    {
      contract_type: 'sales',
      customer_id: reg.get('customer', 'C013'),
      description: 'Pacific Engineering Pump Supply Agreement',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      total_amount: 200000,
      currency: 'USD',
      status: 'active',
      payment_terms: 60,
      items: [
        { product_id: reg.get('product', 'FG-PMP-001'), qty: 30, unit_price: 3600, amount: 108000 },
        { product_id: reg.get('product', 'FG-PMP-002'), qty: 15, unit_price: 5400, amount: 81000 },
      ],
    },
  ];
}
