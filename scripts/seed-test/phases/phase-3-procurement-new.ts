// Phase 3: Procurement New — Purchase Requisitions, RFQs, Supplier Quotations + PO/SO workflow
import type { TestContext } from '../../seed-api-test';

const P = 'phase3';

async function getExistingIds(api: any, resource: string, limit = 3): Promise<string[]> {
  const r = await api.safeGet(`/api/${resource}`, { _limit: limit }, { phase: P, entity: `${resource}-lookup`, index: 0 });
  return (r?.data ?? []).map((d: any) => d.id);
}

export async function runPhase3(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookup existing products and suppliers
  const products = await api.safeGet<any>('/api/products', { _limit: 10, status: 'active' }, meta('products-lookup', 0));
  const prodIds = (products?.data ?? []).map((p: any) => p.id);
  const suppliers = await api.safeGet<any>('/api/suppliers', { _limit: 5, status: 'active' }, meta('suppliers-lookup', 0));
  const supIds = (suppliers?.data ?? []).map((s: any) => s.id);
  const customers = await api.safeGet<any>('/api/customers', { _limit: 5, status: 'active' }, meta('customers-lookup', 0));
  const custIds = (customers?.data ?? []).map((c: any) => c.id);

  if (prodIds.length === 0 || supIds.length === 0) {
    console.log('    ⚠ No products/suppliers found, skipping procurement creation');
    return;
  }

  // --- Purchase Requisitions ---
  // Columns: request_date, required_date, requester_id, department_id, notes, total_amount
  // Lines: product_id, quantity, unit_price, line_number, notes, suggested_supplier_id
  const empList = await api.safeGet<any>('/api/employees', { _limit: 1 }, meta('emp-lookup', 0));
  const requesterId = empList?.data?.[0]?.id;
  const deptList = await api.safeGet<any>('/api/departments', { _limit: 1 }, meta('dept-lookup', 0));
  const deptId = deptList?.data?.[0]?.id;

  const prCount = isOrg2 ? 3 : 5;
  const prIds: string[] = [];
  for (let i = 0; i < prCount; i++) {
    const items = [
      { product_id: prodIds[i % prodIds.length], quantity: 10 + i * 5, unit_price: 100 + i * 10, line_number: 1 },
      { product_id: prodIds[(i + 1) % prodIds.length], quantity: 5 + i * 3, unit_price: 50 + i * 5, line_number: 2 },
    ];
    const pr = await api.safePost<any>('/api/purchase-requisitions', {
      request_date: `2026-04-${String(15 + i).padStart(2, '0')}`,
      required_date: `2026-05-${String(15 + i).padStart(2, '0')}`,
      requester_id: requesterId,
      department_id: deptId,
      notes: `API seed test PR #${i + 1}`,
      items,
    }, meta('pr-create', i));
    if (pr?.data?.id) {
      prIds.push(pr.data.id);
      console.log(`    POST PR → ${pr.data.id}`);
    }
  }

  // PR workflow: submit 3, approve 2, reject 1
  for (let i = 0; i < Math.min(3, prIds.length); i++) {
    await api.safePost(`/api/purchase-requisitions/${prIds[i]}/submit`, {}, meta('pr-submit', i));
    console.log(`    PR ${prIds[i]} → submitted`);
  }
  if (prIds.length >= 1) {
    await api.safePost(`/api/purchase-requisitions/${prIds[0]}/approve`, {}, meta('pr-approve', 0));
    console.log(`    PR ${prIds[0]} → approved`);
  }
  if (prIds.length >= 2) {
    await api.safePost(`/api/purchase-requisitions/${prIds[1]}/approve`, {}, meta('pr-approve', 1));
    console.log(`    PR ${prIds[1]} → approved`);
  }
  if (prIds.length >= 3) {
    await api.safePost(`/api/purchase-requisitions/${prIds[2]}/reject`, { reason: 'Budget exceeded' }, meta('pr-reject', 2));
    console.log(`    PR ${prIds[2]} → rejected`);
  }

  // GET PR lines
  await api.safeGet('/api/purchase-requisition-lines', { _limit: 10 }, meta('pr-lines-list', 0));

  // --- RFQ Headers ---
  // Columns: due_date, purchase_request_id, notes
  // Lines: product_id, qty_requested, unit_of_measure, description, line_number
  const rfqCount = isOrg2 ? 2 : 3;
  const rfqIds: string[] = [];
  for (let i = 0; i < rfqCount; i++) {
    const items = [
      { product_id: prodIds[i % prodIds.length], qty_requested: 100 + i * 50, unit_of_measure: 'PCS', description: `RFQ物料需求 #${i + 1}`, line_number: 1 },
    ];
    const rfq = await api.safePost<any>('/api/rfq-headers', {
      due_date: `2026-05-${String(1 + i).padStart(2, '0')}`,
      notes: `API seed test RFQ #${i + 1}`,
      items,
    }, meta('rfq-create', i));
    if (rfq?.data?.id) {
      rfqIds.push(rfq.data.id);
      console.log(`    POST RFQ → ${rfq.data.id}`);
    }
  }
  await api.safeGet('/api/rfq-headers', { _limit: 10 }, meta('rfq-list', 0));
  if (rfqIds[0]) await api.safeGet(`/api/rfq-headers/${rfqIds[0]}`, undefined, meta('rfq-get', 0));
  await api.safeGet('/api/rfq-lines', { _limit: 10 }, meta('rfq-lines-list', 0));

  // --- Supplier Quotations ---
  // Columns: rfq_id, supplier_id, validity_date, currency, notes
  // Lines: product_id, qty_offered, unit_price, lead_time_days
  const sqCount = isOrg2 ? 2 : 4;
  const sqIds: string[] = [];
  for (let i = 0; i < sqCount; i++) {
    const items = [
      { product_id: prodIds[i % prodIds.length], qty_offered: 100, unit_price: 80 + i * 5, lead_time_days: 7 + i },
    ];
    const sq = await api.safePost<any>('/api/supplier-quotations', {
      validity_date: `2026-06-${String(17 + i).padStart(2, '0')}`,
      supplier_id: supIds[i % supIds.length],
      rfq_id: rfqIds.length > 0 ? rfqIds[i % rfqIds.length] : undefined,
      currency: 'CNY',
      notes: `API seed test SQ #${i + 1}`,
      items,
    }, meta('sq-create', i));
    if (sq?.data?.id) {
      sqIds.push(sq.data.id);
      console.log(`    POST SQ → ${sq.data.id}`);
    }
  }
  await api.safeGet('/api/supplier-quotations', { _limit: 10 }, meta('sq-list', 0));
  if (sqIds[0]) await api.safeGet(`/api/supplier-quotations/${sqIds[0]}`, undefined, meta('sq-get', 0));
  await api.safeGet('/api/supplier-quotation-lines', { _limit: 10 }, meta('sq-lines-list', 0));

  // --- New PO with workflow ---
  const poCount = isOrg2 ? 2 : 3;
  const poIds: string[] = [];
  for (let i = 0; i < poCount; i++) {
    const items = [
      { product_id: prodIds[i % prodIds.length], quantity: 20 + i * 10, unit_price: 100 + i * 15, line_number: 1 },
    ];
    const po = await api.safePost<any>('/api/purchase-orders', {
      supplier_id: supIds[i % supIds.length],
      order_date: `2026-04-${String(18 + i).padStart(2, '0')}`,
      expected_date: `2026-05-${String(5 + i).padStart(2, '0')}`,
      notes: `API seed test PO #${i + 1}`,
      items,
    }, meta('po-create', i));
    if (po?.data?.id) {
      poIds.push(po.data.id);
      console.log(`    POST PO → ${po.data.id}`);
      ctx.createdIds.set('purchase-orders', [...(ctx.createdIds.get('purchase-orders') ?? []), po.data.id]);
    }
  }

  // PO workflow
  for (const id of poIds) {
    await api.safePost(`/api/purchase-orders/${id}/submit`, {}, meta('po-submit', 0));
  }
  if (poIds.length >= 1) {
    await api.safePost(`/api/purchase-orders/${poIds[0]}/approve`, {}, meta('po-approve', 0));
  }
  if (poIds.length >= 2) {
    await api.safePost(`/api/purchase-orders/${poIds[1]}/approve`, {}, meta('po-approve', 1));
  }
  if (poIds.length >= 3) {
    await api.safePost(`/api/purchase-orders/${poIds[2]}/reject`, { reason: 'Price too high' }, meta('po-reject', 0));
  }

  // GET PO list + items
  await api.safeGet('/api/purchase-orders', { _limit: 5 }, meta('po-list', 0));
  await api.safeGet('/api/purchase-order-items', { _limit: 10 }, meta('po-items-list', 0));

  // --- New SO with workflow ---
  if (custIds.length === 0) {
    console.log('    ⚠ No customers found, skipping SO creation');
  } else {
    const soCount = isOrg2 ? 2 : 3;
    const soIds: string[] = [];
    for (let i = 0; i < soCount; i++) {
      const items = [
        { product_id: prodIds[i % prodIds.length], quantity: 15 + i * 5, unit_price: 150 + i * 20, discount_rate: 0, line_number: 1 },
      ];
      const so = await api.safePost<any>('/api/sales-orders', {
        customer_id: custIds[i % custIds.length],
        order_date: `2026-04-${String(18 + i).padStart(2, '0')}`,
        delivery_date: `2026-05-${String(5 + i).padStart(2, '0')}`,
        notes: `API seed test SO #${i + 1}`,
        items,
      }, meta('so-create', i));
      if (so?.data?.id) {
        soIds.push(so.data.id);
        console.log(`    POST SO → ${so.data.id}`);
        ctx.createdIds.set('sales-orders', [...(ctx.createdIds.get('sales-orders') ?? []), so.data.id]);
      }
    }

    // SO workflow
    for (const id of soIds) {
      await api.safePost(`/api/sales-orders/${id}/submit`, {}, meta('so-submit', 0));
    }
    if (soIds.length >= 1) {
      await api.safePost(`/api/sales-orders/${soIds[0]}/approve`, {}, meta('so-approve', 0));
    }
    if (soIds.length >= 2) {
      await api.safePost(`/api/sales-orders/${soIds[1]}/approve`, {}, meta('so-approve', 1));
    }
    if (soIds.length >= 3) {
      await api.safePost(`/api/sales-orders/${soIds[2]}/reject`, { reason: 'Customer credit exceeded' }, meta('so-reject', 0));
    }
  }

  // GET SO list + items
  await api.safeGet('/api/sales-orders', { _limit: 5 }, meta('so-list', 0));
  await api.safeGet('/api/sales-order-items', { _limit: 10 }, meta('so-items-list', 0));

  console.log(`    Phase 3 (${org}) done`);
}
