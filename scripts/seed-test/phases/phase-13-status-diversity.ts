// Phase 13: Status Diversity — Fill missing statuses for key entities
import type { TestContext } from '../../seed-api-test';

const P = 'phase13';

export async function runPhase13(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups
  const prods = await api.safeGet<any>('/api/products', { _limit: 5, status: 'active' }, meta('prod-lookup', 0));
  const prodIds = (prods?.data ?? []).map((p: any) => p.id);
  const sups = await api.safeGet<any>('/api/suppliers', { _limit: 3 }, meta('sup-lookup', 0));
  const supIds = (sups?.data ?? []).map((s: any) => s.id);
  const custs = await api.safeGet<any>('/api/customers', { _limit: 3 }, meta('cust-lookup', 0));
  const custIds = (custs?.data ?? []).map((c: any) => c.id);
  const whs = await api.safeGet<any>('/api/warehouses', { _limit: 2 }, meta('wh-lookup', 0));
  const whIds = (whs?.data ?? []).map((w: any) => w.id);

  if (prodIds.length === 0) return;

  // --- Manufacturing: Work Orders through all states ---
  // Create BOM first
  const bom = await api.safePost<any>('/api/bom-headers', {
    product_id: prodIds[0],
    bom_name: isOrg2 ? 'BOM测试-T' : 'BOM测试-API',
    version: '1.0',
    notes: 'API seed BOM',
    items: [
      { product_id: prodIds[1 % prodIds.length], quantity: 2, unit_of_measure: 'PCS', line_number: 1 },
    ],
  }, meta('bom-create', 0));
  if (bom?.data?.id) {
    console.log(`    POST BOM → ${bom.data.id}`);
    ctx.createdIds.set('bom-headers', [...(ctx.createdIds.get('bom-headers') ?? []), bom.data.id]);
  }
  await api.safeGet('/api/bom-headers', { _limit: 5 }, meta('bom-list', 0));
  await api.safeGet('/api/bom-items', { _limit: 10 }, meta('bom-items-list', 0));

  // Work Orders: draft → released → in_progress → completed
  const woStatuses = ['draft', 'released', 'in_progress', 'completed'];
  for (let i = 0; i < woStatuses.length; i++) {
    const wo = await api.safePost<any>('/api/work-orders', {
      product_id: prodIds[0],
      bom_id: bom?.data?.id,
      planned_quantity: 50 + i * 10,
      planned_start_date: `2026-04-${String(15 + i).padStart(2, '0')}`,
      planned_end_date: `2026-04-${String(25 + i).padStart(2, '0')}`,
      warehouse_id: whIds[0],
      notes: `API seed WO status=${woStatuses[i]}`,
      items: [
        { product_id: prodIds[1 % prodIds.length], quantity: (50 + i * 10) * 2, line_number: 1 },
      ],
    }, meta('wo-create', i));
    if (wo?.data?.id) {
      console.log(`    POST WO → ${wo.data.id}`);
      ctx.createdIds.set('work-orders', [...(ctx.createdIds.get('work-orders') ?? []), wo.data.id]);

      // Progress through states
      if (i >= 1) { // released
        await api.safePost(`/api/work-orders/${wo.data.id}/start`, {}, meta('wo-start', i));
        if (i >= 2) { // in_progress - already started
          // keep as in_progress
        }
        if (i >= 3) { // completed
          await api.safePost(`/api/work-orders/${wo.data.id}/complete`, { actual_quantity: 50 + i * 10 }, meta('wo-complete', i));
        }
      }
    }
  }
  await api.safeGet('/api/work-orders', { _limit: 10 }, meta('wo-list', 0));
  await api.safeGet('/api/work-order-lines', { _limit: 10 }, meta('wo-lines-list', 0));

  // Production Reports
  const wos = await api.safeGet<any>('/api/work-orders', { _limit: 2 }, meta('wo-for-report', 0));
  if (wos?.data?.[0]) {
    await api.safePost('/api/production-reports', {
      work_order_id: wos.data[0].id,
      report_date: '2026-04-22',
      produced_quantity: 45,
      scrap_quantity: 5,
      notes: 'API seed production report',
    }, meta('prod-report', 0));
  }
  await api.safeGet('/api/production-reports', { _limit: 5 }, meta('prod-report-list', 0));

  // --- Create POs in advanced statuses via workflow ---
  // Create a PO, submit, approve for downstream states
  if (supIds.length > 0) {
    const advPo = await api.safePost<any>('/api/purchase-orders', {
      supplier_id: supIds[0],
      order_date: '2026-04-22',
      expected_date: '2026-05-22',
      notes: 'API seed PO for closed status',
      items: [{ product_id: prodIds[0], quantity: 100, unit_price: 50, line_number: 1 }],
    }, meta('po-closed', 0));
    if (advPo?.data?.id) {
      await api.safePost(`/api/purchase-orders/${advPo.data.id}/submit`, {}, meta('po-submit-closed', 0));
      await api.safePost(`/api/purchase-orders/${advPo.data.id}/approve`, {}, meta('po-approve-closed', 0));
      // Create receipt to get to received
      const poDetail = await api.safeGet<any>(`/api/purchase-orders/${advPo.data.id}`, undefined, meta('po-detail-closed', 0));
      const poItems = poDetail?.data?.items ?? [];
      if (poItems.length > 0) {
        const receipt = await api.safePost<any>('/api/purchase-receipts', {
          purchase_order_id: advPo.data.id,
          supplier_id: supIds[0],
          receipt_date: '2026-04-22',
          items: poItems.map((item: any, idx: number) => ({
            purchase_order_item_id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_number: idx + 1,
          })),
        }, meta('receipt-for-po', 0));
        if (receipt?.data?.id) {
          await api.safePost(`/api/purchase-receipts/${receipt.data.id}/confirm`, {}, meta('receipt-confirm-closed', 0));
        }
      }
    }
  }

  // --- Create SOs in advanced statuses ---
  if (custIds.length > 0) {
    const advSo = await api.safePost<any>('/api/sales-orders', {
      customer_id: custIds[0],
      order_date: '2026-04-22',
      delivery_date: '2026-05-22',
      notes: 'API seed SO for completed status',
      items: [{ product_id: prodIds[0], quantity: 30, unit_price: 150, discount_rate: 0, line_number: 1 }],
    }, meta('so-completed', 0));
    if (advSo?.data?.id) {
      await api.safePost(`/api/sales-orders/${advSo.data.id}/submit`, {}, meta('so-submit-completed', 0));
      await api.safePost(`/api/sales-orders/${advSo.data.id}/approve`, {}, meta('so-approve-completed', 0));
      // Create shipment + confirm to progress SO
      const soDetail = await api.safeGet<any>(`/api/sales-orders/${advSo.data.id}`, undefined, meta('so-detail', 0));
      const soItems = soDetail?.data?.items ?? [];
      if (soItems.length > 0) {
        const ship = await api.safePost<any>('/api/sales-shipments', {
          sales_order_id: advSo.data.id,
          customer_id: custIds[0],
          shipment_date: '2026-04-22',
          items: soItems.map((item: any, idx: number) => ({
            sales_order_item_id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            line_number: idx + 1,
          })),
        }, meta('ship-for-so', 0));
        if (ship?.data?.id) {
          await api.safePost(`/api/sales-shipments/${ship.data.id}/confirm`, {}, meta('ship-confirm-completed', 0));
        }
      }
    }
  }

  console.log(`    Phase 13 (${org}) done`);
}
