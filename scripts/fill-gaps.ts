#!/usr/bin/env node
// scripts/fill-gaps.ts
// Fill remaining Org1 data gaps: customer receipts, payment requests, work orders, 3-way match
// Usage: npx tsx scripts/fill-gaps.ts --api-url https://erp.3we.org --token <jwt>

const API_URL = process.argv.find((_, i, a) => a[i - 1] === '--api-url') ?? 'https://erp.3we.org';
const TOKEN = process.argv.find((_, i, a) => a[i - 1] === '--token') ?? process.env.ADMIN_TOKEN ?? '';

if (!TOKEN) { console.error('Usage: npx tsx scripts/fill-gaps.ts --api-url <url> --token <jwt>'); process.exit(1); }

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(method: string, path: string, body?: unknown): Promise<any> {
  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.json();
}

async function fetchAll(path: string): Promise<any[]> {
  const resp = await api('GET', `${path}?_start=0&_end=500&_sort=created_at&_order=asc`);
  return resp?.data ?? [];
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomAmount(min: number, max: number): number { return +(min + Math.random() * (max - min)).toFixed(2); }

async function main() {
  console.log('=== Fill Org1 Data Gaps ===\n');

  // --- 1. Customer Receipts from Sales Invoices ---
  console.log('--- Creating Customer Receipts ---');
  const salesInvoices = await fetchAll('/api/sales-invoices');
  console.log(`  Found ${salesInvoices.length} sales invoices`);

  let created = 0;
  for (const inv of salesInvoices.slice(0, Math.floor(salesInvoices.length * 0.6))) {
    const total = parseFloat(inv.total_amount ?? '10000');
    const payPct = 0.5 + Math.random() * 0.5;
    // Get detail to retrieve customer_id
    const detail = await api('GET', `/api/sales-invoices/${inv.id}`);
    const custId = detail?.data?.customer_id;
    if (!custId) { console.log(`  SKIP: no customer_id for ${inv.invoice_number}`); continue; }

    const result = await api('POST', '/api/customer-receipts', {
      customer_id: custId,
      reference_type: 'sales_invoice',
      reference_id: inv.id,
      receipt_date: inv.invoice_date ?? '2026-02-15',
      amount: +(total * payPct).toFixed(2),
      payment_method: pick(['bank_transfer', 'bank_transfer', 'check', 'wire']),
    });
    if (result?.data) created++;
    else console.log(`  FAIL: ${JSON.stringify(result).slice(0, 120)}`);
  }
  console.log(`  Created ${created} customer receipts\n`);

  // --- 2. Payment Requests from Supplier Invoices ---
  console.log('--- Creating Payment Requests ---');
  const supplierInvoices = await fetchAll('/api/supplier-invoices');
  console.log(`  Found ${supplierInvoices.length} supplier invoices`);

  created = 0;
  for (const inv of supplierInvoices.slice(0, Math.floor(supplierInvoices.length * 0.4))) {
    const total = parseFloat(inv.total_amount ?? '5000');
    // Get detail to retrieve supplier_id (list only returns nested supplier object)
    const detail = await api('GET', `/api/supplier-invoices/${inv.id}`);
    const suppId = detail?.data?.supplier_id;
    if (!suppId) { console.log(`  SKIP: no supplier_id for ${inv.invoice_number}`); continue; }

    const result = await api('POST', '/api/payment-requests', {
      supplier_id: suppId,
      supplier_invoice_id: inv.id,
      amount: total,
      currency: inv.currency ?? 'CNY',
      payment_method: 'bank_transfer',
      ok_to_pay: Math.random() > 0.3,
    });
    if (result?.data) created++;
    else console.log(`  FAIL: ${JSON.stringify(result).slice(0, 120)}`);
  }
  console.log(`  Created ${created} payment requests\n`);

  // --- 3. Work Orders from existing BOMs ---
  console.log('--- Creating Work Orders ---');
  const boms = await fetchAll('/api/bom-headers');
  console.log(`  Found ${boms.length} BOMs`);

  const warehouses = await fetchAll('/api/warehouses');
  const warehouseId = warehouses.find((w: any) => w.name?.includes('主') || w.code === 'WH-MAIN')?.id ?? warehouses[0]?.id;

  const workOrderDefs = [
    { bomIdx: 0, qty: 50, targetStatus: 'completed' },
    { bomIdx: 0, qty: 30, targetStatus: 'in_progress' },
    { bomIdx: 1, qty: 10, targetStatus: 'completed' },
    { bomIdx: 1, qty: 5, targetStatus: 'in_progress' },
    { bomIdx: 2, qty: 20, targetStatus: 'released' },
  ];

  created = 0;
  for (const def of workOrderDefs) {
    if (def.bomIdx >= boms.length) continue;
    const bom = boms[def.bomIdx];

    // Create work order
    const woResult = await api('POST', '/api/work-orders', {
      product_id: bom.product_id ?? bom.product?.id,
      bom_header_id: bom.id,
      planned_quantity: def.qty,
      warehouse_id: warehouseId,
      start_date: '2025-11-01',
      planned_completion_date: '2026-03-31',
    });
    if (!woResult?.data) { console.log(`  FAIL create WO: ${JSON.stringify(woResult).slice(0, 120)}`); continue; }

    const woId = woResult.data.id;
    created++;

    // Release
    await api('PUT', `/api/work-orders/${woId}`, { status: 'released' });

    // Issue materials + complete for in_progress/completed
    if (def.targetStatus === 'in_progress' || def.targetStatus === 'completed') {
      const issueResult = await api('POST', `/api/work-orders/${woId}/issue-materials`, {});
      if (issueResult?.type) console.log(`  Issue materials warning: ${issueResult.detail?.slice(0, 80)}`);
    }

    if (def.targetStatus === 'completed') {
      await api('PUT', `/api/work-orders/${woId}`, { completed_quantity: def.qty });
      const compResult = await api('POST', `/api/work-orders/${woId}/complete`, {});
      if (compResult?.type) console.log(`  Complete warning: ${compResult.detail?.slice(0, 80)}`);
    }
  }
  console.log(`  Created ${created} work orders\n`);

  // --- 4. Three-Way Match ---
  console.log('--- Creating Three-Way Match ---');
  const receipts = (await fetchAll('/api/purchase-receipts')).filter((r: any) => r.status === 'confirmed');
  console.log(`  Found ${receipts.length} confirmed receipts, ${supplierInvoices.length} supplier invoices`);

  created = 0;
  const matchCount = Math.min(receipts.length, supplierInvoices.length, 6);
  for (let i = 0; i < matchCount; i++) {
    const receipt = receipts[i];
    const invoice = supplierInvoices[i];
    const poId = receipt.purchase_order_id ?? receipt.purchase_order?.id;
    if (!poId) continue;

    const result = await api('POST', '/api/three-way-match', {
      purchase_order_id: poId,
      purchase_receipt_id: receipt.id,
      supplier_invoice_id: invoice.id,
    });
    if (result?.data) created++;
    else console.log(`  FAIL: ${JSON.stringify(result).slice(0, 120)}`);
  }
  console.log(`  Created ${created} three-way match results\n`);

  console.log('=== Done ===');
}

main().catch(console.error);
