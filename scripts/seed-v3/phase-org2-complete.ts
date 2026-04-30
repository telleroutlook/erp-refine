import { SeedClient } from '../seed-v2/client';

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`  [SKIP] ${label}: ${String(err.message ?? err).slice(0, 160)}`);
    return null;
  }
}

export async function seedOrg2Complete(client: SeedClient) {
  console.log(`\n  [org2] Discovering IDs for org2-complete...`);
  const [products, suppliers, customers, warehouses, employees, accountSubjects, existingWorkOrders] = await Promise.all([
    client.get('/products?_start=0&_end=50').catch(() => []),
    client.get('/suppliers?_start=0&_end=20').catch(() => []),
    client.get('/customers?_start=0&_end=20').catch(() => []),
    client.get('/warehouses?_start=0&_end=10').catch(() => []),
    client.get('/employees?_start=0&_end=10').catch(() => []),
    client.get('/account-subjects?_start=0&_end=20').catch(() => []),
    client.get('/work-orders?_start=0&_end=10').catch(() => []),
  ]);

  const prodIds: string[]   = (Array.isArray(products) ? products : []).map((x: any) => x.id).filter(Boolean);
  const supIds: string[]    = (Array.isArray(suppliers) ? suppliers : []).map((x: any) => x.id).filter(Boolean);
  const custIds: string[]   = (Array.isArray(customers) ? customers : []).map((x: any) => x.id).filter(Boolean);
  const whIds: string[]     = (Array.isArray(warehouses) ? warehouses : []).map((x: any) => x.id).filter(Boolean);
  const empIds: string[]    = (Array.isArray(employees) ? employees : []).map((x: any) => x.id).filter(Boolean);
  const acctIds: string[]   = (Array.isArray(accountSubjects) ? accountSubjects : []).map((x: any) => x.id).filter(Boolean);
  // Work order IDs used as reference_id for quality inspections (collected after WO creation below)
  let woRefIds: string[]    = (Array.isArray(existingWorkOrders) ? existingWorkOrders : []).map((x: any) => x.id).filter(Boolean);

  if (prodIds.length === 0) {
    console.warn('  [org2] No products found — skipping org2-complete');
    return;
  }

  // ── BOMs ──────────────────────────────────────────────────────────────────
  console.log('  [org2] Creating BOMs...');
  const bomDefs = [
    {
      product_id: prodIds[0],
      version: 1,
      quantity: 1,
      notes: 'IoT控制器标准配方',
      effective_date: '2026-01-01',
      is_active: true,
      items: [
        { product_id: prodIds[2 % prodIds.length], quantity: 2, unit: 'PCS', scrap_rate: 0.02, sequence: 1 },
        { product_id: prodIds[3 % prodIds.length], quantity: 1, unit: 'M',   scrap_rate: 0.05, sequence: 2 },
      ],
    },
    {
      product_id: prodIds[1 % prodIds.length],
      version: 2,
      quantity: 1,
      notes: '网关产品生产配方',
      effective_date: '2026-02-01',
      is_active: true,
      items: [
        { product_id: prodIds[2 % prodIds.length], quantity: 3, unit: 'PCS', scrap_rate: 0.02, sequence: 1 },
        { product_id: prodIds[3 % prodIds.length], quantity: 2, unit: 'M',   scrap_rate: 0.05, sequence: 2 },
      ],
    },
  ];

  const bomIds: string[] = [];
  // Fetch existing BOMs first; only create if none exist
  const existingBoms = await client.get('/bom-headers?_start=0&_end=10').catch(() => []);
  const existingBomList: any[] = Array.isArray(existingBoms) ? existingBoms : [];
  if (existingBomList.length >= 2) {
    console.log(`  [org2] BOMs already exist (${existingBomList.length} found), reusing IDs...`);
    existingBomList.slice(0, 2).forEach((b: any) => { if (b?.id) bomIds.push(b.id); });
  } else {
    for (let i = 0; i < bomDefs.length; i++) {
      const bom = await safe(`BOM #${i + 1}`, () => client.post('/bom-headers', bomDefs[i] as any));
      if (bom?.id) bomIds.push(bom.id);
    }
  }

  if (bomIds.length === 0 || whIds.length === 0) {
    console.warn('  [org2] No BOMs or warehouses — skipping work orders');
  } else {
    // ── Work Orders ─────────────────────────────────────────────────────────
    console.log('  [org2] Creating work orders...');
    const woDefs = [
      { product_id: prodIds[0], bom_header_id: bomIds[0], planned_quantity: 20, warehouse_id: whIds[0], start_date: '2026-01-10', planned_completion_date: '2026-01-25', notes: 'Jan IoT控制器生产', workflow: 'complete' },
      { product_id: prodIds[1 % prodIds.length], bom_header_id: bomIds[Math.min(1, bomIds.length - 1)], planned_quantity: 15, warehouse_id: whIds[0], start_date: '2026-02-15', planned_completion_date: '2026-03-01', notes: 'Feb网关生产', workflow: 'in_progress' },
      { product_id: prodIds[0], bom_header_id: bomIds[0], planned_quantity: 30, warehouse_id: whIds[0], start_date: '2026-03-10', planned_completion_date: '2026-04-10', notes: 'Mar控制器生产', workflow: 'released' },
      { product_id: prodIds[1 % prodIds.length], bom_header_id: bomIds[Math.min(1, bomIds.length - 1)], planned_quantity: 10, warehouse_id: whIds[0], start_date: '2026-04-20', planned_completion_date: '2026-05-20', notes: 'Apr网关计划', workflow: 'none' },
    ];

    const newWoIds: string[] = [];
    for (let i = 0; i < woDefs.length; i++) {
      const def = woDefs[i];
      const { workflow, ...woBody } = def;
      const wo = await safe(`WO #${i + 1}`, () => client.post('/work-orders', woBody as any));
      if (!wo?.id) continue;
      newWoIds.push(wo.id);

      if (workflow === 'released' || workflow === 'in_progress' || workflow === 'complete') {
        await safe(`WO #${i + 1} release`, () => client.put(`/work-orders/${wo.id}`, { status: 'released' }));
      }
      if (workflow === 'in_progress' || workflow === 'complete') {
        // Prefer issue-materials (proper workflow), fall back to direct status update
        const issueResult = await safe(`WO #${i + 1} issue-materials`, () => client.post(`/work-orders/${wo.id}/issue-materials`, {}));
        if (!issueResult) {
          await safe(`WO #${i + 1} set in_progress`, () => client.put(`/work-orders/${wo.id}`, { status: 'in_progress' }));
        }
      }
      if (workflow === 'complete') {
        await safe(`WO #${i + 1} set completed_quantity`, () => client.put(`/work-orders/${wo.id}`, { completed_quantity: def.planned_quantity }));
        await safe(`WO #${i + 1} complete`, () => client.post(`/work-orders/${wo.id}/complete`, {}));
      }
    }
    // Merge newly created WO IDs for use in quality inspections
    if (newWoIds.length > 0) woRefIds = [...newWoIds, ...woRefIds];
  }

  // ── Quality Inspections ───────────────────────────────────────────────────
  console.log('  [org2] Creating quality inspections...');
  if (woRefIds.length === 0) {
    console.warn('  [org2] No work order IDs for quality inspection reference_id — skipping QI');
  } else {
    const qiDefs = [
      {
        reference_type: 'work_order', reference_id: woRefIds[0], product_id: prodIds[0],
        inspection_date: '2026-01-25', total_quantity: 20, qualified_quantity: 20, defective_quantity: 0,
        result: 'pass', notes: '一月批次全检合格',
        ...(empIds[0] ? { inspector_id: empIds[0] } : {}),
        workflow: 'complete',
        complete_body: { qualified_quantity: 20, defective_quantity: 0, result: 'pass' },
        items: [
          { check_item: '外观检查', check_result: 'pass', check_standard: '无明显缺陷', measured_value: '合格' },
          { check_item: '功能测试', check_result: 'pass', check_standard: '全功能正常', measured_value: '通过' },
        ],
      },
      {
        reference_type: 'work_order', reference_id: woRefIds[1 % woRefIds.length], product_id: prodIds[1 % prodIds.length],
        inspection_date: '2026-02-20', total_quantity: 15, qualified_quantity: 13, defective_quantity: 2,
        result: 'conditional', notes: '部分批次尺寸偏差略超标',
        ...(empIds[0] ? { inspector_id: empIds[0] } : {}),
        workflow: 'complete',
        complete_body: { qualified_quantity: 13, defective_quantity: 2, result: 'conditional' },
        items: [
          { check_item: '尺寸测量', check_result: 'fail', check_standard: '公差±0.1mm', measured_value: '±0.15mm' },
        ],
      },
      {
        reference_type: 'work_order', reference_id: woRefIds[2 % woRefIds.length], product_id: prodIds[0],
        inspection_date: '2026-03-15', total_quantity: 30, qualified_quantity: 0, defective_quantity: 0,
        result: 'pending', notes: '检验进行中',
        workflow: 'none',
        items: [],
      },
      {
        reference_type: 'work_order', reference_id: woRefIds[3 % woRefIds.length], product_id: prodIds[1 % prodIds.length],
        inspection_date: '2026-04-10', total_quantity: 10, qualified_quantity: 5, defective_quantity: 5,
        result: 'fail', notes: '批次性能测试不合格',
        workflow: 'none',
        items: [
          { check_item: '性能测试', check_result: 'fail', check_standard: '通过率>95%', measured_value: '50%' },
        ],
      },
    ];

    for (let i = 0; i < qiDefs.length; i++) {
      const def = qiDefs[i];
      const { workflow, complete_body, items, ...header } = def as any;
      const body: any = { ...header };
      if (items.length > 0) body.items = items;
      const qi = await safe(`QI #${i + 1}`, () => client.post('/quality-inspections', body));
      if (!qi?.id) continue;

      if (workflow === 'complete' && complete_body) {
        await safe(`QI #${i + 1} complete`, () => client.post(`/quality-inspections/${qi.id}/complete`, complete_body));
      }
    }
  }

  // ── Contracts ─────────────────────────────────────────────────────────────
  console.log('  [org2] Creating contracts...');
  const contractDefs = [
    {
      contract_type: 'procurement', party_type: 'supplier', party_id: supIds[0],
      description: '2026年度MCU芯片采购框架合同', start_date: '2026-01-01', end_date: '2026-12-31',
      total_amount: 200000, currency: 'CNY', notes: '年度框架采购合同', workflow: 'activate',
      items: [{ product_id: prodIds[2 % prodIds.length], quantity: 5000, unit_price: 40 }],
    },
    {
      contract_type: 'sales', party_type: 'customer', party_id: custIds[0],
      description: '2026年度物联网设备供货合同', start_date: '2026-04-01', end_date: '2027-03-31',
      total_amount: 500000, currency: 'CNY', notes: '年度销售合同', workflow: 'activate',
      items: [
        { product_id: prodIds[0], quantity: 200, unit_price: 1800 },
        { product_id: prodIds[1 % prodIds.length], quantity: 100, unit_price: 1350 },
      ],
    },
    {
      contract_type: 'service', party_type: 'supplier', party_id: supIds[1 % Math.max(supIds.length, 1)],
      description: '技术维护服务协议', start_date: '2026-06-01', end_date: '2027-05-31',
      total_amount: 50000, currency: 'CNY', notes: '年度技术支持服务合同', workflow: 'none',
      items: [],
    },
  ];

  for (let i = 0; i < contractDefs.length; i++) {
    const def = contractDefs[i];
    const { workflow, items, ...header } = def;
    if (!header.party_id) { console.warn(`  [org2] Contract #${i + 1}: no party_id, skipping`); continue; }
    const contract = await safe(`contract #${i + 1}`, () => client.post('/contracts', { ...header, items }));
    if (!contract?.id) continue;

    if (workflow === 'activate') {
      await safe(`contract #${i + 1} activate`, () => client.post(`/contracts/${contract.id}/activate`, {}));
    }
  }

  // ── Vouchers ──────────────────────────────────────────────────────────────
  // NOTE: body key is "entries" — finance.ts: const { entries: entryItems, ...headerFields } = body
  console.log('  [org2] Creating vouchers...');
  if (acctIds.length < 2) {
    console.warn('  [org2] Need at least 2 account subjects for vouchers — skipping');
  } else {
    const voucherDefs = [
      { voucher_date: '2026-01-31', voucher_type: 'payment',  notes: '一月采购付款',   amount: 22000,  workflow: 'post' },
      { voucher_date: '2026-02-15', voucher_type: 'receipt',  notes: '二月销售收款',   amount: 35000,  workflow: 'post' },
      { voucher_date: '2026-02-28', voucher_type: 'general',  notes: '二月期末结转',   amount: 8500,   workflow: 'post' },
      { voucher_date: '2026-03-31', voucher_type: 'payment',  notes: '三月供应商付款', amount: 87500,  workflow: 'post' },
      { voucher_date: '2026-03-31', voucher_type: 'transfer', notes: '三月费用转出',   amount: 15000,  workflow: 'post' },
      { voucher_date: '2026-04-15', voucher_type: 'receipt',  notes: '四月回款',       amount: 48000,  workflow: 'none' },
      { voucher_date: '2026-04-30', voucher_type: 'general',  notes: '四月期末调整',   amount: 6000,   workflow: 'none' },
      { voucher_date: '2026-05-10', voucher_type: 'transfer', notes: '五月备用金',     amount: 10000,  workflow: 'none' },
    ];

    for (let i = 0; i < voucherDefs.length; i++) {
      const def = voucherDefs[i];
      const { workflow, amount, ...header } = def;
      const voucher = await safe(`voucher #${i + 1}`, () =>
        client.post('/vouchers', {
          ...header,
          entries: [
            { account_subject_id: acctIds[0],     entry_type: 'debit',  amount, summary: header.notes },
            { account_subject_id: acctIds[1], entry_type: 'credit', amount, summary: header.notes },
          ],
        })
      );
      if (!voucher?.id) continue;

      if (workflow === 'post') {
        await safe(`voucher #${i + 1} post`, () => client.post(`/vouchers/${voucher.id}/post`, {}));
      }
    }
  }

  // ── Budgets ───────────────────────────────────────────────────────────────
  // NOTE: body key is "lines" — finance.ts: const { lines, ...headerFields } = body
  // period_month is INTEGER (1-12), not a date string
  console.log('  [org2] Creating budgets...');
  const budgetDefs = [
    {
      budget_name: '2026年度运营预算',
      budget_year: 2026,
      total_amount: 2000000,
      currency: 'CNY',
      lines: Array.from({ length: 12 }, (_, m) => ({
        account_code: '6001',
        period_month: m + 1,
        planned_amount: 140000 + Math.floor(Math.random() * 60000),
        description: `${m + 1}月运营费用`,
      })),
    },
    {
      budget_name: '2026年度研发预算',
      budget_year: 2026,
      total_amount: 500000,
      currency: 'CNY',
      lines: [
        { account_code: '6401', period_month: 1, planned_amount: 42000, description: '一月研发投入' },
        { account_code: '6401', period_month: 2, planned_amount: 42000, description: '二月研发投入' },
        { account_code: '6401', period_month: 3, planned_amount: 42000, description: '三月研发投入' },
        { account_code: '6401', period_month: 4, planned_amount: 42000, description: '四月研发投入' },
        { account_code: '6401', period_month: 5, planned_amount: 42000, description: '五月研发投入' },
        { account_code: '6401', period_month: 6, planned_amount: 42000, description: '六月研发投入' },
        { account_code: '6401', period_month: 7, planned_amount: 42000, description: '七月研发投入' },
        { account_code: '6401', period_month: 8, planned_amount: 41000, description: '八月研发投入' },
        { account_code: '6401', period_month: 9, planned_amount: 41000, description: '九月研发投入' },
        { account_code: '6401', period_month: 10, planned_amount: 41000, description: '十月研发投入' },
        { account_code: '6401', period_month: 11, planned_amount: 41000, description: '十一月研发投入' },
        { account_code: '6401', period_month: 12, planned_amount: 41000, description: '十二月研发投入' },
      ],
    },
  ];

  for (let i = 0; i < budgetDefs.length; i++) {
    await safe(`budget #${i + 1}`, () => client.post('/budgets', budgetDefs[i] as any));
  }

  console.log('  [org2] Phase org2-complete done.');
}
