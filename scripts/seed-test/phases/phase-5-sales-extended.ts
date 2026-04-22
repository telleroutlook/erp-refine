// Phase 5: Sales Extended — Sales Returns, Return Credits, Shipment Tracking
import type { TestContext } from '../../seed-api-test';

const P = 'phase5';

export async function runPhase5(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookup existing data
  const customers = await api.safeGet<any>('/api/customers', { _limit: 5 }, meta('cust-lookup', 0));
  const custIds = (customers?.data ?? []).map((c: any) => c.id);
  const prods = await api.safeGet<any>('/api/products', { _limit: 5, status: 'active' }, meta('prod-lookup', 0));
  const prodIds = (prods?.data ?? []).map((p: any) => p.id);

  // Lookup confirmed shipments
  const shipments = await api.safeGet<any>('/api/sales-shipments', { _limit: 5 }, meta('ship-lookup', 0));
  const shipmentIds = (shipments?.data ?? []).map((s: any) => s.id);

  // Lookup approved sales orders for creating new shipments
  const approvedSOs = await api.safeGet<any>('/api/sales-orders', { _limit: 3, status: 'approved' }, meta('so-approved-lookup', 0));
  const soIds = (approvedSOs?.data ?? []).map((s: any) => s.id);

  // --- Create a sales shipment + confirm if we have approved SOs ---
  if (soIds.length > 0 && prodIds.length > 0) {
    const soDetail = await api.safeGet<any>(`/api/sales-orders/${soIds[0]}`, undefined, meta('so-detail', 0));
    const soItems = soDetail?.data?.items ?? [];
    if (soItems.length > 0) {
      const shipItems = soItems.map((item: any, idx: number) => ({
        sales_order_item_id: item.id,
        product_id: item.product_id,
        quantity: Math.min(item.quantity, 5),
        line_number: idx + 1,
      }));
      const ship = await api.safePost<any>('/api/sales-shipments', {
        sales_order_id: soIds[0],
        customer_id: soDetail?.data?.customer_id ?? custIds[0],
        shipment_date: '2026-04-22',
        notes: 'API seed shipment',
        items: shipItems,
      }, meta('ship-create', 0));
      if (ship?.data?.id) {
        console.log(`    POST Shipment → ${ship.data.id}`);
        await api.safePost(`/api/sales-shipments/${ship.data.id}/confirm`, {}, meta('ship-confirm', 0));
        console.log(`    Shipment ${ship.data.id} → confirmed`);
        shipmentIds.push(ship.data.id);
        ctx.createdIds.set('sales-shipments', [...(ctx.createdIds.get('sales-shipments') ?? []), ship.data.id]);
      }
    }
  }

  await api.safeGet('/api/sales-shipments', { _limit: 5 }, meta('ship-list', 0));
  await api.safeGet('/api/sales-shipment-items', { _limit: 10 }, meta('ship-items-list', 0));

  // --- Sales Returns ---
  const returnCount = isOrg2 ? 2 : 4;
  const returnIds: string[] = [];
  for (let i = 0; i < returnCount; i++) {
    const items = [
      { product_id: prodIds[i % prodIds.length], quantity: 2 + i, unit_price: 100 + i * 10, reason: `质量问题 #${i + 1}`, line_number: 1 },
    ];
    const ret = await api.safePost<any>('/api/sales-returns', {
      customer_id: custIds[i % custIds.length] ?? custIds[0],
      sales_order_id: soIds.length > 0 ? soIds[i % soIds.length] : undefined,
      return_date: `2026-04-${String(20 + i).padStart(2, '0')}`,
      reason: `客户退货 #${i + 1}`,
      notes: `API seed return #${i + 1}`,
      items,
    }, meta('return-create', i));
    if (ret?.data?.id) {
      returnIds.push(ret.data.id);
      console.log(`    POST Return → ${ret.data.id}`);
      ctx.createdIds.set('sales-returns', [...(ctx.createdIds.get('sales-returns') ?? []), ret.data.id]);
    }
  }

  // Return statuses: leave [0] as draft, approve [1], approve+receive [2], reject [3]
  if (returnIds.length >= 2) {
    await api.safePut(`/api/sales-returns/${returnIds[1]}`, { status: 'approved' }, meta('return-approve', 1));
  }
  if (returnIds.length >= 3) {
    await api.safePut(`/api/sales-returns/${returnIds[2]}`, { status: 'approved' }, meta('return-approve', 2));
    await api.safePut(`/api/sales-returns/${returnIds[2]}`, { status: 'received' }, meta('return-receive', 2));
  }
  if (returnIds.length >= 4) {
    await api.safePut(`/api/sales-returns/${returnIds[3]}`, { status: 'rejected' }, meta('return-reject', 3));
  }

  await api.safeGet('/api/sales-returns', { _limit: 10 }, meta('return-list', 0));
  await api.safeGet('/api/sales-return-items', { _limit: 10 }, meta('return-items-list', 0));
  if (returnIds[0]) {
    await api.safeGet(`/api/sales-returns/${returnIds[0]}`, undefined, meta('return-get', 0));
  }

  // --- Sales Invoices ---
  if (custIds.length > 0) {
    const invItems = [
      { product_id: prodIds[0], quantity: 10, unit_price: 150, line_number: 1 },
    ];
    const inv = await api.safePost<any>('/api/sales-invoices', {
      customer_id: custIds[0],
      invoice_date: '2026-04-22',
      due_date: '2026-05-22',
      notes: 'API seed sales invoice',
      items: invItems,
    }, meta('sales-inv-create', 0));
    if (inv?.data?.id) {
      console.log(`    POST Sales Invoice → ${inv.data.id}`);
      ctx.createdIds.set('sales-invoices', [...(ctx.createdIds.get('sales-invoices') ?? []), inv.data.id]);
    }
  }
  await api.safeGet('/api/sales-invoices', { _limit: 5 }, meta('sales-inv-list', 0));
  await api.safeGet('/api/sales-invoice-items', { _limit: 10 }, meta('sales-inv-items-list', 0));

  // --- Sales Return Credits ---
  if (returnIds.length >= 3) {
    for (let i = 0; i < 2; i++) {
      await api.safePost('/api/sales-return-credits', {
        sales_return_id: returnIds[i + 1],
        customer_id: custIds[i % custIds.length] ?? custIds[0],
        credit_amount: 200 + i * 50,
        credit_date: '2026-04-22',
        notes: `API seed credit #${i + 1}`,
      }, meta('credit-create', i));
    }
  }
  await api.safeGet('/api/sales-return-credits', { _limit: 10 }, meta('credits-list', 0));

  // --- Customer Receipts ---
  if (custIds.length > 0) {
    const salesInvs = await api.safeGet<any>('/api/sales-invoices', { _limit: 1 }, meta('inv-for-receipt', 0));
    const invId = salesInvs?.data?.[0]?.id;
    await api.safePost('/api/customer-receipts', {
      customer_id: custIds[0],
      receipt_date: '2026-04-22',
      amount: 1500,
      payment_method: 'bank_transfer',
      reference_type: invId ? 'sales_invoice' : 'sales_order',
      reference_id: invId ?? soIds[0],
      notes: 'API seed customer receipt',
    }, meta('cust-receipt-create', 0));
  }
  await api.safeGet('/api/customer-receipts', { _limit: 5 }, meta('cust-receipt-list', 0));

  // --- Shipment Tracking Events ---
  // Columns: shipment_id, event_type, occurred_at, location, notes
  if (shipmentIds.length > 0) {
    const events = [
      { event_type: 'picked_up', occurred_at: '2026-04-22T09:00:00Z', location: '上海仓库', notes: '已揽收' },
      { event_type: 'in_transit', occurred_at: '2026-04-22T14:00:00Z', location: '上海分拣中心', notes: '运输中' },
      { event_type: 'out_for_delivery', occurred_at: '2026-04-23T08:00:00Z', location: '北京配送站', notes: '正在派送' },
      { event_type: 'delivered', occurred_at: '2026-04-23T11:00:00Z', location: '客户地址', notes: '已签收' },
    ];
    for (let i = 0; i < events.length; i++) {
      await api.safePost('/api/shipment-tracking-events', {
        shipment_id: shipmentIds[0],
        ...events[i],
      }, meta('tracking-event', i));
    }
  }
  await api.safeGet('/api/shipment-tracking-events', { _limit: 10 }, meta('tracking-list', 0));

  // --- AR Aging ---
  await api.safeGet('/api/ar-aging', { _limit: 5 }, meta('ar-aging-list', 0));
  if (custIds[0]) {
    await api.safeGet(`/api/ar-aging/${custIds[0]}`, undefined, meta('ar-aging-detail', 0));
  }

  console.log(`    Phase 5 (${org}) done`);
}
