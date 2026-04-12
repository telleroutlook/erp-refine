// scripts/seed/phases/phase5-finance.ts
// Phase 5: Finance documents
// - Supplier invoices for confirmed receipts
// - Sales invoices for confirmed shipments
// - Customer receipts (AR payments)
// - Payment requests
// - Vouchers
// - Three-way match

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';
import type { GeneratedDocument } from '../types';
import type { IdRegistry } from '../id-registry';
import { randomDate, randomAmount, pick } from '../data/shared';

export async function runPhase5(
  client: SeedApiClient,
  progress: SeedProgress,
  registry: IdRegistry,
  confirmedReceipts: GeneratedDocument[],
  confirmedShipments: GeneratedDocument[],
  purchaseOrders: GeneratedDocument[],
  salesOrders: GeneratedDocument[],
  orgName: string
): Promise<{
  supplierInvoices: GeneratedDocument[];
  salesInvoices: GeneratedDocument[];
}> {
  // ~70% of receipts get invoiced, ~60% of shipments get invoiced
  const receiptsToInvoice = confirmedReceipts.slice(0, Math.floor(confirmedReceipts.length * 0.7));
  const shipmentsToInvoice = confirmedShipments.slice(0, Math.floor(confirmedShipments.length * 0.6));

  const totalOps = receiptsToInvoice.length + shipmentsToInvoice.length
    + Math.floor(shipmentsToInvoice.length * 0.5) // customer receipts
    + Math.floor(receiptsToInvoice.length * 0.4) // payment requests
    + Math.min(receiptsToInvoice.length, 6) // 3-way match
    + 15; // vouchers
  progress.startPhase(`Phase 5: Finance [${orgName}]`, totalOps);

  // --- 5a: Supplier Invoices ---
  const supplierInvoices: GeneratedDocument[] = [];
  for (const receipt of receiptsToInvoice) {
    // Fetch receipt to get items
    const receiptDetail = await client.get(`/api/purchase-receipts/${receipt.id}`);
    if (!receiptDetail?.data) { progress.tick(false); continue; }

    const items = (receiptDetail.data.items ?? receiptDetail.data.purchase_receipt_items ?? []).map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity ?? item.qty,
      unit_price: item.unit_price ?? randomAmount(10, 500),
    }));

    const totalAmount = items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
    const taxAmount = +(totalAmount * 0.13).toFixed(2);

    const resp = await client.safePost('/api/supplier-invoices', {
      purchase_order_id: receipt.refs.purchase_order_id,
      supplier_id: receipt.refs.supplier_id,
      invoice_date: receipt.date,
      due_date: randomDate(new Date(receipt.date), new Date(new Date(receipt.date).getTime() + 60 * 86400000)),
      total_amount: +(totalAmount + taxAmount).toFixed(2),
      tax_amount: taxAmount,
      currency: 'CNY',
      items,
    }, { phase: 'phase5', entity: 'supplier-invoice', index: 0 });

    if (resp?.data) {
      supplierInvoices.push({
        id: resp.data.id,
        orderNumber: resp.data.invoice_number,
        date: receipt.date,
        status: 'draft',
        itemCount: items.length,
        refs: { purchase_order_id: receipt.refs.purchase_order_id, supplier_id: receipt.refs.supplier_id, receipt_id: receipt.id },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  // --- 5b: Sales Invoices ---
  const salesInvoices: GeneratedDocument[] = [];
  for (const shipment of shipmentsToInvoice) {
    // Fetch shipment to get items
    const shipDetail = await client.get(`/api/sales-shipments/${shipment.id}`);
    if (!shipDetail?.data) { progress.tick(false); continue; }

    const items = (shipDetail.data.items ?? shipDetail.data.sales_shipment_items ?? []).map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity ?? item.qty,
      unit_price: item.unit_price ?? randomAmount(100, 5000),
    }));

    const totalAmount = items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
    const taxAmount = +(totalAmount * 0.13).toFixed(2);

    const resp = await client.safePost('/api/sales-invoices', {
      sales_order_id: shipment.refs.sales_order_id,
      customer_id: shipment.refs.customer_id,
      invoice_date: shipment.date,
      due_date: randomDate(new Date(shipment.date), new Date(new Date(shipment.date).getTime() + 60 * 86400000)),
      total_amount: +(totalAmount + taxAmount).toFixed(2),
      tax_amount: taxAmount,
      currency: 'CNY',
      items,
    }, { phase: 'phase5', entity: 'sales-invoice', index: 0 });

    if (resp?.data) {
      salesInvoices.push({
        id: resp.data.id,
        orderNumber: resp.data.invoice_number,
        date: shipment.date,
        status: 'draft',
        itemCount: items.length,
        refs: { sales_order_id: shipment.refs.sales_order_id, customer_id: shipment.refs.customer_id, shipment_id: shipment.id },
      });
      progress.tick(true);
    } else {
      progress.tick(false);
    }
  }

  // --- 5c: Customer Receipts (partial payments for ~50% of sales invoices) ---
  const invoicesToPay = salesInvoices.slice(0, Math.floor(salesInvoices.length * 0.5));
  for (const inv of invoicesToPay) {
    // Get invoice detail for total_amount
    const invDetail = await client.get(`/api/sales-invoices/${inv.id}`);
    const totalAmount = invDetail?.data?.total_amount ?? 10000;
    const payAmount = +(totalAmount * (0.5 + Math.random() * 0.5)).toFixed(2);

    const resp = await client.safePost('/api/customer-receipts', {
      customer_id: inv.refs.customer_id,
      reference_type: 'sales_invoice',
      reference_id: inv.id,
      receipt_date: randomDate(new Date(inv.date), new Date(new Date(inv.date).getTime() + 30 * 86400000)),
      amount: payAmount,
      payment_method: pick(['bank_transfer', 'bank_transfer', 'check', 'wire']),
    }, { phase: 'phase5', entity: 'customer-receipt', index: 0 });

    progress.tick(!!resp?.data);
  }

  // --- 5d: Payment Requests (for ~40% of supplier invoices) ---
  const invoicesToRequest = supplierInvoices.slice(0, Math.floor(supplierInvoices.length * 0.4));
  for (const inv of invoicesToRequest) {
    const invDetail = await client.get(`/api/supplier-invoices/${inv.id}`);
    const totalAmount = invDetail?.data?.total_amount ?? 5000;

    const resp = await client.safePost('/api/payment-requests', {
      supplier_id: inv.refs.supplier_id,
      supplier_invoice_id: inv.id,
      amount: totalAmount,
      currency: 'CNY',
      payment_method: 'bank_transfer',
      ok_to_pay: Math.random() > 0.3,
    }, { phase: 'phase5', entity: 'payment-request', index: 0 });

    progress.tick(!!resp?.data);
  }

  // --- 5e: Three-Way Match (for receipts that also have invoices) ---
  const matchCount = Math.min(receiptsToInvoice.length, supplierInvoices.length, 6);
  for (let i = 0; i < matchCount; i++) {
    const receipt = confirmedReceipts[i];
    const invoice = supplierInvoices[i];
    if (!receipt || !invoice) { progress.tick(false); continue; }

    const resp = await client.safePost('/api/three-way-match', {
      purchase_order_id: receipt.refs.purchase_order_id,
      purchase_receipt_id: receipt.id,
      supplier_invoice_id: invoice.id,
    }, { phase: 'phase5', entity: 'three-way-match', index: i });

    progress.tick(!!resp?.data);
  }

  // --- 5f: Vouchers (accounting entries) ---
  const voucherData = generateVoucherData(registry, salesInvoices, supplierInvoices);
  for (let i = 0; i < voucherData.length; i++) {
    const resp = await client.safePost('/api/vouchers', voucherData[i], {
      phase: 'phase5', entity: 'voucher', index: i,
    });

    // Post some vouchers
    if (resp?.data && i < 10) {
      await client.safePost(`/api/vouchers/${resp.data.id}/post`, {}, {
        phase: 'phase5', entity: 'voucher-post', index: i,
      });
    }
    progress.tick(!!resp?.data);
  }

  progress.endPhase();
  return { supplierInvoices, salesInvoices };
}

function generateVoucherData(
  registry: IdRegistry,
  salesInvoices: GeneratedDocument[],
  supplierInvoices: GeneratedDocument[]
): Array<Record<string, unknown>> {
  const vouchers: Array<Record<string, unknown>> = [];

  const arAccountId = registry.tryGet('account', '1122'); // 应收账款
  const apAccountId = registry.tryGet('account', '2202'); // 应付账款
  const revenueAccountId = registry.tryGet('account', '6001'); // 主营业务收入
  const cogsAccountId = registry.tryGet('account', '6401'); // 主营业务成本
  const rawMaterialAccountId = registry.tryGet('account', '1401'); // 原材料
  const bankAccountId = registry.tryGet('account', '1002'); // 银行存款
  const depreciationAccountId = registry.tryGet('account', '1602'); // 累计折旧
  const gaExpenseAccountId = registry.tryGet('account', '6602'); // 管理费用

  if (!arAccountId || !apAccountId || !revenueAccountId || !bankAccountId) return [];

  // Sales revenue vouchers (DR: AR, CR: Revenue)
  for (let i = 0; i < Math.min(salesInvoices.length, 5); i++) {
    const amount = randomAmount(5000, 100000);
    vouchers.push({
      voucher_date: salesInvoices[i].date,
      voucher_type: 'revenue',
      notes: `销售收入确认 - ${salesInvoices[i].orderNumber}`,
      entries: [
        { entry_type: 'debit', account_subject_id: arAccountId, amount, summary: `应收账款 - ${salesInvoices[i].orderNumber}`, sequence: 1 },
        { entry_type: 'credit', account_subject_id: revenueAccountId, amount, summary: `主营业务收入 - ${salesInvoices[i].orderNumber}`, sequence: 2 },
      ],
    });
  }

  // Purchase cost vouchers (DR: Raw Materials, CR: AP)
  for (let i = 0; i < Math.min(supplierInvoices.length, 6); i++) {
    const amount = randomAmount(3000, 80000);
    vouchers.push({
      voucher_date: supplierInvoices[i].date,
      voucher_type: 'expense',
      notes: `采购入库 - ${supplierInvoices[i].orderNumber}`,
      entries: [
        { entry_type: 'debit', account_subject_id: rawMaterialAccountId ?? apAccountId, amount, summary: `原材料入库 - ${supplierInvoices[i].orderNumber}`, sequence: 1 },
        { entry_type: 'credit', account_subject_id: apAccountId, amount, summary: `应付账款 - ${supplierInvoices[i].orderNumber}`, sequence: 2 },
      ],
    });
  }

  // Customer payment vouchers (DR: Bank, CR: AR)
  for (let i = 0; i < 2; i++) {
    const amount = randomAmount(10000, 200000);
    vouchers.push({
      voucher_date: `2026-0${i + 1}-15`,
      voucher_type: 'receipt',
      notes: `客户收款`,
      entries: [
        { entry_type: 'debit', account_subject_id: bankAccountId, amount, summary: '银行收款', sequence: 1 },
        { entry_type: 'credit', account_subject_id: arAccountId, amount, summary: '冲销应收账款', sequence: 2 },
      ],
    });
  }

  // Depreciation vouchers (DR: G&A Expense, CR: Accumulated Depreciation)
  if (depreciationAccountId && gaExpenseAccountId) {
    for (let i = 0; i < 2; i++) {
      const amount = randomAmount(15000, 30000);
      vouchers.push({
        voucher_date: `2026-0${i + 1}-28`,
        voucher_type: 'depreciation',
        notes: `${2026}年${i + 1}月折旧计提`,
        entries: [
          { entry_type: 'debit', account_subject_id: gaExpenseAccountId, amount, summary: `${i + 1}月管理费用-折旧`, sequence: 1 },
          { entry_type: 'credit', account_subject_id: depreciationAccountId, amount, summary: `${i + 1}月累计折旧`, sequence: 2 },
        ],
      });
    }
  }

  return vouchers;
}
