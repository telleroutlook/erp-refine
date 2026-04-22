// Phase 4: Procurement Extended — ASNs + Reconciliation Statements
import type { TestContext } from '../../seed-api-test';

const P = 'phase4';

export async function runPhase4(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookup approved POs
  const pos = await api.safeGet<any>('/api/purchase-orders', { _limit: 5, status: 'approved' }, meta('po-lookup', 0));
  const approvedPOs = pos?.data ?? [];

  // Lookup suppliers
  const sups = await api.safeGet<any>('/api/suppliers', { _limit: 5 }, meta('sup-lookup', 0));
  const supIds = (sups?.data ?? []).map((s: any) => s.id);

  // Lookup products
  const prods = await api.safeGet<any>('/api/products', { _limit: 5, status: 'active' }, meta('prod-lookup', 0));
  const prodIds = (prods?.data ?? []).map((p: any) => p.id);

  // Lookup warehouses
  const whs = await api.safeGet<any>('/api/warehouses', { _limit: 2 }, meta('wh-lookup', 0));
  const whIds = (whs?.data ?? []).map((w: any) => w.id);

  // --- Advance Shipment Notices ---
  // Columns: asn_no (auto), po_id, supplier_id, expected_date, warehouse_id, status, remark
  // Lines: check asn_lines schema
  const asnCount = isOrg2 ? 2 : 4;
  for (let i = 0; i < Math.min(asnCount, Math.max(approvedPOs.length, 1)); i++) {
    const po = approvedPOs[i];
    const items = [
      {
        item_id: prodIds[i % prodIds.length],
        quantity: 10 + i * 5,
        lot_no: `LOT-ASN-${Date.now()}-${i}`,
        line_number: 1,
      },
    ];
    const asn = await api.safePost<any>('/api/advance-shipment-notices', {
      po_id: po?.id,
      supplier_id: po?.supplier_id ?? supIds[0],
      expected_date: `2026-04-${String(25 + i).padStart(2, '0')}`,
      warehouse_id: whIds.length > 0 ? whIds[0] : undefined,
      remark: `API seed ASN #${i + 1}`,
      items,
    }, meta('asn-create', i));
    if (asn?.data?.id) {
      console.log(`    POST ASN → ${asn.data.id}`);
      ctx.createdIds.set('advance-shipment-notices', [...(ctx.createdIds.get('advance-shipment-notices') ?? []), asn.data.id]);
    }
  }
  // If no approved POs, create standalone ASNs
  if (approvedPOs.length === 0 && supIds.length > 0) {
    for (let i = 0; i < asnCount; i++) {
      const items = [
        { item_id: prodIds[i % prodIds.length], quantity: 20, lot_no: `LOT-ASN-S-${i}`, line_number: 1 },
      ];
      await api.safePost('/api/advance-shipment-notices', {
        supplier_id: supIds[i % supIds.length],
        expected_date: `2026-04-${String(25 + i).padStart(2, '0')}`,
        warehouse_id: whIds.length > 0 ? whIds[0] : undefined,
        remark: `API seed standalone ASN #${i + 1}`,
        items,
      }, meta('asn-standalone', i));
    }
  }

  await api.safeGet('/api/advance-shipment-notices', { _limit: 10 }, meta('asn-list', 0));
  const asnList = await api.safeGet<any>('/api/advance-shipment-notices', { _limit: 1 }, meta('asn-first', 0));
  if (asnList?.data?.[0]) {
    await api.safeGet(`/api/advance-shipment-notices/${asnList.data[0].id}`, undefined, meta('asn-get', 0));
  }
  await api.safeGet('/api/asn-lines', { _limit: 10 }, meta('asn-lines-list', 0));

  // --- Reconciliation Statements ---
  // Columns: supplier_id, period_start, period_end, statement_period, total_amount, paid_amount, currency, notes
  // Lines: item_id (product_id), description, quantity, unit_price, line_amount
  const reconCount = isOrg2 ? 2 : 3;
  for (let i = 0; i < reconCount; i++) {
    const lineAmount1 = (100 + i * 20) * (50 + i * 5);
    const items = [
      { item_id: prodIds[0], description: `采购物料批次 ${i + 1}`, quantity: 100 + i * 20, unit_price: 50 + i * 5, line_amount: lineAmount1 },
      { item_id: prodIds[1 % prodIds.length], description: `服务费用 ${i + 1}`, quantity: 1, unit_price: 500, line_amount: 500 },
    ];
    const recon = await api.safePost<any>('/api/reconciliation-statements', {
      supplier_id: supIds[i % supIds.length],
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      statement_period: '2026-03',
      total_amount: lineAmount1 + 500,
      paid_amount: 0,
      currency: 'CNY',
      notes: `API seed reconciliation #${i + 1}`,
      items,
    }, meta('recon-create', i));
    if (recon?.data?.id) {
      console.log(`    POST Reconciliation → ${recon.data.id}`);
      ctx.createdIds.set('reconciliation-statements', [...(ctx.createdIds.get('reconciliation-statements') ?? []), recon.data.id]);
    }
  }

  await api.safeGet('/api/reconciliation-statements', { _limit: 10 }, meta('recon-list', 0));
  await api.safeGet('/api/reconciliation-lines', { _limit: 10 }, meta('recon-lines-list', 0));

  // --- Purchase Receipts (create + confirm workflow) ---
  if (approvedPOs.length > 0) {
    const po = approvedPOs[0];
    // Get PO detail to find items
    const poDetail = await api.safeGet<any>(`/api/purchase-orders/${po.id}`, undefined, meta('po-detail', 0));
    const poItems = poDetail?.data?.items ?? [];

    if (poItems.length > 0) {
      const receiptItems = poItems.map((item: any, idx: number) => ({
        purchase_order_item_id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_number: idx + 1,
      }));
      const receipt = await api.safePost<any>('/api/purchase-receipts', {
        purchase_order_id: po.id,
        supplier_id: po.supplier_id,
        receipt_date: '2026-04-22',
        warehouse_id: whIds[0],
        notes: 'API seed receipt',
        items: receiptItems,
      }, meta('receipt-create', 0));
      if (receipt?.data?.id) {
        console.log(`    POST Receipt → ${receipt.data.id}`);
        // Confirm receipt
        await api.safePost(`/api/purchase-receipts/${receipt.data.id}/confirm`, {}, meta('receipt-confirm', 0));
        console.log(`    Receipt ${receipt.data.id} → confirmed`);
        ctx.createdIds.set('purchase-receipts', [...(ctx.createdIds.get('purchase-receipts') ?? []), receipt.data.id]);
      }
    }
  }

  await api.safeGet('/api/purchase-receipts', { _limit: 5 }, meta('receipt-list', 0));
  await api.safeGet('/api/purchase-receipt-items', { _limit: 10 }, meta('receipt-items-list', 0));

  // --- Supplier Invoices ---
  if (supIds.length > 0) {
    const items = [
      { product_id: prodIds[0], quantity: 50, unit_price: 100, line_number: 1 },
    ];
    const inv = await api.safePost<any>('/api/supplier-invoices', {
      supplier_id: supIds[0],
      invoice_date: '2026-04-22',
      due_date: '2026-05-22',
      notes: 'API seed supplier invoice',
      items,
    }, meta('sup-inv-create', 0));
    if (inv?.data?.id) {
      console.log(`    POST Supplier Invoice → ${inv.data.id}`);
      ctx.createdIds.set('supplier-invoices', [...(ctx.createdIds.get('supplier-invoices') ?? []), inv.data.id]);
    }
  }
  await api.safeGet('/api/supplier-invoices', { _limit: 5 }, meta('sup-inv-list', 0));
  await api.safeGet('/api/supplier-invoice-items', { _limit: 10 }, meta('sup-inv-items-list', 0));

  // --- Three-Way Match ---
  await api.safeGet('/api/three-way-match', { _limit: 5 }, meta('3way-list', 0));

  console.log(`    Phase 4 (${org}) done`);
}
