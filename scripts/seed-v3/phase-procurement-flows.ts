import { SeedClient } from '../seed-v2/client';

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`  [SKIP] ${label}: ${String(err.message ?? err).slice(0, 160)}`);
    return null;
  }
}

export async function seedProcurementFlows(client: SeedClient, org: string) {
  console.log(`\n  [${org}] Discovering IDs for procurement flows...`);
  const [products, suppliers, warehouses, departments, employees, approvedPOs] = await Promise.all([
    client.get('/products?_start=0&_end=50').catch(() => []),
    client.get('/suppliers?_start=0&_end=20').catch(() => []),
    client.get('/warehouses?_start=0&_end=10').catch(() => []),
    client.get('/departments?_start=0&_end=20').catch(() => []),
    client.get('/employees?_start=0&_end=10').catch(() => []),
    client.get('/purchase-orders?_start=0&_end=20&status=approved').catch(() => []),
  ]);

  const prodIds: string[] = (Array.isArray(products) ? products : []).map((x: any) => x.id).filter(Boolean);
  const supIds: string[]  = (Array.isArray(suppliers) ? suppliers : []).map((x: any) => x.id).filter(Boolean);
  const whIds: string[]   = (Array.isArray(warehouses) ? warehouses : []).map((x: any) => x.id).filter(Boolean);
  const deptIds: string[] = (Array.isArray(departments) ? departments : []).map((x: any) => x.id).filter(Boolean);
  const empIds: string[]  = (Array.isArray(employees) ? employees : []).map((x: any) => x.id).filter(Boolean);
  const poList: any[]     = Array.isArray(approvedPOs) ? approvedPOs : [];

  if (prodIds.length === 0 || supIds.length === 0) {
    console.warn(`  [${org}] Missing products or suppliers — skipping procurement flows`);
    return;
  }

  // ── Purchase Requisitions ─────────────────────────────────────────────────
  console.log(`  [${org}] Creating purchase requisitions...`);
  const prDefs = org === 'org1'
    ? [
        { request_date: '2026-01-10', required_date: '2026-02-10', notes: 'Q1原材料采购申请', workflow: 'approve',
          items: [
            { product_id: prodIds[0], quantity: 200, unit_price: 45, line_number: 1, notes: '备用库存' },
            { product_id: prodIds[1 % prodIds.length], quantity: 100, unit_price: 32, line_number: 2, notes: '紧急补充' },
          ] },
        { request_date: '2026-02-05', required_date: '2026-03-05', notes: 'Q1橡胶件采购', workflow: 'approve',
          items: [{ product_id: prodIds[2 % prodIds.length], quantity: 80, unit_price: 120, line_number: 1 }] },
        { request_date: '2026-02-20', required_date: '2026-03-20', notes: '大批铝材采购申请', workflow: 'reject',
          items: [{ product_id: prodIds[0], quantity: 300, unit_price: 45, line_number: 1 }] },
        { request_date: '2026-03-01', required_date: '2026-04-01', notes: 'Q2不锈钢采购', workflow: 'submit',
          items: [{ product_id: prodIds[1 % prodIds.length], quantity: 500, unit_price: 32, line_number: 1 }] },
        { request_date: '2026-04-15', required_date: '2026-05-15', notes: '季末补充备料', workflow: 'none',
          items: [{ product_id: prodIds[0], quantity: 150, unit_price: 45, line_number: 1 }] },
      ]
    : [
        { request_date: '2026-01-08', required_date: '2026-02-08', notes: 'Q1 component purchase', workflow: 'approve',
          items: [{ product_id: prodIds[0], quantity: 500, unit_price: 44, line_number: 1 }] },
        { request_date: '2026-03-01', required_date: '2026-04-01', notes: 'Q2 gateway modules', workflow: 'reject',
          items: [{ product_id: prodIds[1 % prodIds.length], quantity: 200, unit_price: 175, line_number: 1 }] },
        { request_date: '2026-04-20', required_date: '2026-05-20', notes: 'Emergency stock replenishment', workflow: 'none',
          items: [{ product_id: prodIds[0], quantity: 300, unit_price: 44, line_number: 1 }] },
      ];

  for (let i = 0; i < prDefs.length; i++) {
    const def = prDefs[i];
    const { workflow, items, ...header } = def;
    const body: any = { ...header, items };
    if (deptIds[0]) body.department_id = deptIds[i % deptIds.length];
    if (empIds[0]) body.requester_id = empIds[i % empIds.length];

    const pr = await safe(`PR #${i + 1}`, () => client.post('/purchase-requisitions', body));
    if (!pr?.id) continue;

    if (workflow === 'approve' || workflow === 'reject' || workflow === 'submit') {
      await safe(`PR #${i + 1} submit`, () => client.post(`/purchase-requisitions/${pr.id}/submit`, {}));
    }
    if (workflow === 'approve') {
      await safe(`PR #${i + 1} approve`, () => client.post(`/purchase-requisitions/${pr.id}/approve`, {}));
    }
    if (workflow === 'reject') {
      await safe(`PR #${i + 1} reject`, () => client.post(`/purchase-requisitions/${pr.id}/reject`, { reason: '预算不足' }));
    }
  }

  // ── RFQ Headers ───────────────────────────────────────────────────────────
  console.log(`  [${org}] Creating RFQ headers...`);
  // RFQ status check constraint: draft | issued | closed | cancelled (NOT 'sent')
  const rfqDefs = org === 'org1'
    ? [
        { due_date: '2026-03-15', notes: '铝合金板材询价', workflow: 'issued',
          items: [
            { product_id: prodIds[0], qty_requested: 500, unit_of_measure: 'KG', description: '铝合金板材A级', line_number: 1 },
            { product_id: prodIds[1 % prodIds.length], qty_requested: 300, unit_of_measure: 'M', description: '不锈钢管', line_number: 2 },
          ] },
        { due_date: '2026-04-01', notes: '橡胶件季度询价', workflow: 'closed',
          items: [{ product_id: prodIds[2 % prodIds.length], qty_requested: 200, unit_of_measure: 'KG', description: 'NBR橡胶密封件', line_number: 1 }] },
        { due_date: '2026-05-01', notes: 'Q2原材料询价', workflow: 'none',
          items: [{ product_id: prodIds[0], qty_requested: 1000, unit_of_measure: 'KG', description: '铝合金板材大批量', line_number: 1 }] },
      ]
    : [
        { due_date: '2026-03-20', notes: 'MCU chip RFQ', workflow: 'issued',
          items: [{ product_id: prodIds[0], qty_requested: 2000, unit_of_measure: 'PCS', description: 'MCU芯片', line_number: 1 }] },
        { due_date: '2026-04-15', notes: 'Gateway module RFQ', workflow: 'none',
          items: [{ product_id: prodIds[1 % prodIds.length], qty_requested: 500, unit_of_measure: 'PCS', description: '物联网网关', line_number: 1 }] },
      ];

  const rfqIds: string[] = [];
  for (let i = 0; i < rfqDefs.length; i++) {
    const def = rfqDefs[i];
    const { workflow, items, ...header } = def;
    const rfq = await safe(`RFQ #${i + 1}`, () => client.post('/rfq-headers', { ...header, items }));
    if (!rfq?.id) continue;
    rfqIds.push(rfq.id);

    if (workflow === 'issued' || workflow === 'closed') {
      await safe(`RFQ #${i + 1} issued`, () => client.put(`/rfq-headers/${rfq.id}`, { status: 'issued' }));
    }
    if (workflow === 'closed') {
      await safe(`RFQ #${i + 1} closed`, () => client.put(`/rfq-headers/${rfq.id}`, { status: 'closed' }));
    }
  }

  // ── Supplier Quotations ───────────────────────────────────────────────────
  console.log(`  [${org}] Creating supplier quotations...`);
  const sqDefs = org === 'org1'
    ? [
        { supplier_id: supIds[0], rfq_id: rfqIds[0], validity_date: '2026-04-30', currency: 'CNY', notes: '宁波永信铝业报价单#1',
          items: [
            { product_id: prodIds[0], qty_offered: 500, unit_price: 43.5, lead_time_days: 10 },
            { product_id: prodIds[1 % prodIds.length], qty_offered: 300, unit_price: 30.0, lead_time_days: 7 },
          ] },
        { supplier_id: supIds[1 % supIds.length], rfq_id: rfqIds[0], validity_date: '2026-04-30', currency: 'CNY', notes: '太钢不锈钢竞争报价',
          items: [
            { product_id: prodIds[0], qty_offered: 500, unit_price: 44.0, lead_time_days: 14 },
            { product_id: prodIds[1 % prodIds.length], qty_offered: 300, unit_price: 29.5, lead_time_days: 5 },
          ] },
        { supplier_id: supIds[0], rfq_id: rfqIds[1], validity_date: '2026-05-15', currency: 'CNY', notes: '橡胶件报价',
          items: [{ product_id: prodIds[2 % prodIds.length], qty_offered: 200, unit_price: 115.0, lead_time_days: 21 }] },
        { supplier_id: supIds[2 % supIds.length], rfq_id: rfqIds[0], validity_date: '2026-06-30', currency: 'CNY', notes: '新供应商独立报价',
          items: [{ product_id: prodIds[0], qty_offered: 1000, unit_price: 42.0, lead_time_days: 30 }] },
      ]
    : [
        { supplier_id: supIds[0], rfq_id: rfqIds[0], validity_date: '2026-04-20', currency: 'CNY', notes: 'MCU报价单#1',
          items: [{ product_id: prodIds[0], qty_offered: 2000, unit_price: 44.0, lead_time_days: 14 }] },
        { supplier_id: supIds[1 % supIds.length], rfq_id: rfqIds[0], validity_date: '2026-04-20', currency: 'CNY', notes: 'MCU竞争报价',
          items: [{ product_id: prodIds[0], qty_offered: 2000, unit_price: 43.5, lead_time_days: 10 }] },
        { supplier_id: supIds[0], rfq_id: rfqIds[0], validity_date: '2026-05-31', currency: 'USD', notes: 'Gateway standalone quote',
          items: [{ product_id: prodIds[1 % prodIds.length], qty_offered: 500, unit_price: 188.0, lead_time_days: 21 }] },
      ];

  for (let i = 0; i < sqDefs.length; i++) {
    const def = sqDefs[i];
    if (!def.rfq_id) delete (def as any).rfq_id;
    await safe(`Supplier Quotation #${i + 1}`, () => client.post('/supplier-quotations', def as any));
  }

  // ── Advance Shipment Notices ──────────────────────────────────────────────
  console.log(`  [${org}] Creating advance shipment notices...`);
  if (whIds.length === 0) {
    console.warn(`  [${org}] No warehouses found — skipping ASNs`);
  } else {
    const asnDefs = org === 'org1'
      ? [
          { supplier_id: poList[0]?.supplier_id ?? supIds[0], po_id: poList[0]?.id, expected_date: '2026-01-20', warehouse_id: whIds[0], remark: '第一批次预发货通知',
            items: [{ item_id: prodIds[0], quantity: 100, lot_no: 'LOT-2026-01-001', line_number: 1 }] },
          { supplier_id: poList[1]?.supplier_id ?? supIds[0], po_id: poList[1]?.id, expected_date: '2026-02-15', warehouse_id: whIds[0], remark: '二月份到货通知',
            items: [
              { item_id: prodIds[1 % prodIds.length], quantity: 200, lot_no: 'LOT-2026-02-001', line_number: 1 },
              { item_id: prodIds[2 % prodIds.length], quantity: 50,  lot_no: 'LOT-2026-02-002', line_number: 2 },
            ] },
          { supplier_id: supIds[1 % supIds.length], expected_date: '2026-03-10', warehouse_id: whIds[0], remark: '三月到货',
            items: [{ item_id: prodIds[0], quantity: 150, lot_no: 'LOT-2026-03-001', line_number: 1 }] },
          { supplier_id: supIds[2 % supIds.length], expected_date: '2026-05-05', warehouse_id: whIds[0], remark: '五月预到货',
            items: [{ item_id: prodIds[1 % prodIds.length], quantity: 300, lot_no: 'LOT-2026-05-001', line_number: 1 }] },
        ]
      : [
          { supplier_id: poList[0]?.supplier_id ?? supIds[0], po_id: poList[0]?.id, expected_date: '2026-02-20', warehouse_id: whIds[0], remark: 'Feb shipment',
            items: [{ item_id: prodIds[0], quantity: 500, lot_no: 'LOT-TW-2026-02-001', line_number: 1 }] },
          { supplier_id: supIds[0], expected_date: '2026-04-25', warehouse_id: whIds[0], remark: 'Apr shipment',
            items: [{ item_id: prodIds[1 % prodIds.length], quantity: 200, lot_no: 'LOT-TW-2026-04-001', line_number: 1 }] },
        ];

    for (let i = 0; i < asnDefs.length; i++) {
      const def = asnDefs[i];
      if (!def.po_id) delete (def as any).po_id;
      await safe(`ASN #${i + 1}`, () => client.post('/advance-shipment-notices', def as any));
    }
  }

  // ── Reconciliation Statements ─────────────────────────────────────────────
  console.log(`  [${org}] Creating reconciliation statements...`);
  if (supIds.length === 0) {
    console.warn(`  [${org}] No suppliers — skipping reconciliation`);
  } else {
    const reconDefs = org === 'org1'
      ? [
          { supplier_id: supIds[0], period_start: '2026-01-01', period_end: '2026-01-31', total_amount: 45000, paid_amount: 45000, currency: 'CNY', notes: '一月账期对账',
            items: [{ item_id: prodIds[0], description: '铝合金板材采购', quantity: 1000, unit_price: 45, line_amount: 45000 }] },
          { supplier_id: supIds[1 % supIds.length], period_start: '2026-02-01', period_end: '2026-02-28', total_amount: 67200, paid_amount: 50000, currency: 'CNY', notes: '二月账期对账（部分付款）',
            items: [
              { item_id: prodIds[1 % prodIds.length], description: '不锈钢管采购', quantity: 2100, unit_price: 32, line_amount: 67200 },
            ] },
          { supplier_id: supIds[2 % supIds.length], period_start: '2026-03-01', period_end: '2026-03-31', total_amount: 16000, paid_amount: 0, currency: 'CNY', notes: '三月新供应商首次对账',
            items: [{ item_id: prodIds[0], description: '首次采购', quantity: 200, unit_price: 80, line_amount: 16000 }] },
        ]
      : [
          { supplier_id: supIds[0], period_start: '2026-02-01', period_end: '2026-02-28', total_amount: 22000, paid_amount: 22000, currency: 'CNY', notes: 'Feb reconciliation',
            items: [{ item_id: prodIds[0], description: 'MCU芯片采购', quantity: 500, unit_price: 44, line_amount: 22000 }] },
          { supplier_id: supIds[0], period_start: '2026-03-01', period_end: '2026-03-31', total_amount: 87500, paid_amount: 0, currency: 'CNY', notes: 'Mar reconciliation',
            items: [
              { item_id: prodIds[0], description: 'MCU芯片批量采购', quantity: 1000, unit_price: 44, line_amount: 44000 },
              { item_id: prodIds[1 % prodIds.length], description: '网关模块采购', quantity: 250, unit_price: 175, line_amount: 43750 },
            ] },
        ];

    for (let i = 0; i < reconDefs.length; i++) {
      await safe(`Reconciliation #${i + 1}`, () => client.post('/reconciliation-statements', reconDefs[i] as any));
    }
  }

  console.log(`  [${org}] Phase procurement-flows done.`);
}
