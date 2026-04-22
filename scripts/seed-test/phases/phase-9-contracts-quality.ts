// Phase 9: Contracts & Quality — Contract workflows, Quality Standards, Inspections
import type { TestContext } from '../../seed-api-test';

const P = 'phase9';

export async function runPhase9(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups
  const custs = await api.safeGet<any>('/api/customers', { _limit: 3 }, meta('cust-lookup', 0));
  const custIds = (custs?.data ?? []).map((c: any) => c.id);
  const sups = await api.safeGet<any>('/api/suppliers', { _limit: 3 }, meta('sup-lookup', 0));
  const supIds = (sups?.data ?? []).map((s: any) => s.id);
  const prods = await api.safeGet<any>('/api/products', { _limit: 5, status: 'active' }, meta('prod-lookup', 0));
  const prodIds = (prods?.data ?? []).map((p: any) => p.id);
  const whs = await api.safeGet<any>('/api/warehouses', { _limit: 2 }, meta('wh-lookup', 0));
  const whIds = (whs?.data ?? []).map((w: any) => w.id);

  // --- Contracts ---
  const contracts = [
    {
      contract_type: 'procurement',
      party_type: 'supplier',
      party_id: supIds[0],
      title: isOrg2 ? '年度采购框架合同-T' : '年度采购框架合同-API',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      total_amount: 1000000,
      notes: 'API seed procurement contract',
      items: [
        { product_id: prodIds[0], quantity: 500, unit_price: 100, line_number: 1 },
        { product_id: prodIds[1 % prodIds.length], quantity: 300, unit_price: 200, line_number: 2 },
      ],
    },
    {
      contract_type: 'sales',
      party_type: 'customer',
      party_id: custIds[0],
      title: isOrg2 ? '销售合作协议-T' : '销售合作协议-API',
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      total_amount: 500000,
      notes: 'API seed sales contract',
      items: [
        { product_id: prodIds[0], quantity: 200, unit_price: 150, line_number: 1 },
      ],
    },
  ];

  const contractIds: string[] = [];
  for (let i = 0; i < contracts.length; i++) {
    if (!contracts[i].party_id) continue;
    const c = await api.safePost<any>('/api/contracts', contracts[i], meta('contract-create', i));
    if (c?.data?.id) {
      contractIds.push(c.data.id);
      console.log(`    POST Contract → ${c.data.id} (${contracts[i].contract_type})`);
      ctx.createdIds.set('contracts', [...(ctx.createdIds.get('contracts') ?? []), c.data.id]);
    }
  }

  // Activate first contract
  if (contractIds.length >= 1) {
    await api.safePut(`/api/contracts/${contractIds[0]}`, { status: 'active' }, meta('contract-activate', 0));
    console.log(`    Contract ${contractIds[0]} → active`);
  }

  // Contract milestones
  for (let i = 0; i < contractIds.length; i++) {
    const milestones = [
      { title: '首批交付', due_date: '2026-06-30', amount: 200000, description: '第一阶段交付', sequence_order: 1 },
      { title: '尾款结算', due_date: '2026-12-31', amount: 300000, description: '最终结算', sequence_order: 2 },
    ];
    for (let j = 0; j < milestones.length; j++) {
      await api.safePost(`/api/contract-milestones`, {
        contract_id: contractIds[i],
        ...milestones[j],
      }, meta('milestone', i * 10 + j));
    }
  }
  await api.safeGet('/api/contracts', { _limit: 10 }, meta('contract-list', 0));
  await api.safeGet('/api/contract-items', { _limit: 10 }, meta('contract-items-list', 0));
  await api.safeGet('/api/contract-milestones', { _limit: 10 }, meta('milestone-list', 0));

  // --- Defect Codes ---
  const defectCodes = [
    { code: isOrg2 ? 'DC-DIM-T' : 'DC-DIM-A', name: '尺寸偏差', severity: 'major', description: '产品尺寸超出公差范围' },
    { code: isOrg2 ? 'DC-SUR-T' : 'DC-SUR-A', name: '表面缺陷', severity: 'minor', description: '产品表面有划痕或瑕疵' },
  ];
  for (let i = 0; i < defectCodes.length; i++) {
    await api.safePost('/api/defect-codes', defectCodes[i], meta('defect-code', i));
  }
  await api.safeGet('/api/defect-codes', { _limit: 10 }, meta('defect-codes-list', 0));

  // --- Quality Standards ---
  // Columns: standard_name, standard_code, description, is_active
  // Items: item_name, check_method, acceptance_criteria, is_mandatory, sequence_order, standard_id (auto)
  for (let i = 0; i < 2; i++) {
    const qs = await api.safePost<any>('/api/quality-standards', {
      standard_name: isOrg2 ? `质量标准-T-${i + 1}` : `质量标准-API-${i + 1}`,
      standard_code: isOrg2 ? `QS-T-${i + 1}` : `QS-A-${i + 1}`,
      description: `API seed quality standard #${i + 1}`,
      is_active: true,
      items: [
        { item_name: '外观检查', check_method: '目视检查', acceptance_criteria: '无明显缺陷', is_mandatory: true, sequence_order: 1 },
        { item_name: '尺寸测量', check_method: '游标卡尺测量', acceptance_criteria: '公差±0.1mm', is_mandatory: true, sequence_order: 2 },
        { item_name: '功能测试', check_method: '功能测试台', acceptance_criteria: '全部功能正常', is_mandatory: false, sequence_order: 3 },
      ],
    }, meta('quality-std', i));
    if (qs?.data?.id) {
      console.log(`    POST Quality Standard → ${qs.data.id}`);
    }
  }
  await api.safeGet('/api/quality-standards', { _limit: 10 }, meta('qs-list', 0));
  await api.safeGet('/api/quality-standard-items', { _limit: 10 }, meta('qs-items-list', 0));

  // --- Quality Inspections ---
  // Columns: reference_type, reference_id, product_id, inspection_date, inspector_id,
  //          total_quantity, qualified_quantity, defective_quantity, result, notes
  // Items: check_item, check_result, check_standard, measured_value, notes
  const receipts = await api.safeGet<any>('/api/purchase-receipts', { _limit: 2 }, meta('receipt-lookup', 0));
  const receiptIds = (receipts?.data ?? []).map((r: any) => r.id);
  const inspectorId = (await api.safeGet<any>('/api/employees', { _limit: 1 }, meta('emp-for-insp', 0)))?.data?.[0]?.id;

  for (let i = 0; i < 2; i++) {
    const qi = await api.safePost<any>('/api/quality-inspections', {
      reference_type: receiptIds[i] ? 'purchase_receipt' : 'in_process',
      reference_id: receiptIds[i],
      product_id: prodIds[i % prodIds.length],
      inspection_date: `2026-04-${String(20 + i).padStart(2, '0')}`,
      inspector_id: inspectorId,
      total_quantity: 50 + i * 25,
      qualified_quantity: 48 + i * 24,
      defective_quantity: 2 + i,
      result: i === 0 ? 'pass' : 'conditional',
      notes: `API seed inspection #${i + 1}`,
      items: [
        { check_item: '外观检查', check_result: 'pass', check_standard: '无缺陷', measured_value: '合格', notes: '无缺陷' },
        { check_item: '尺寸测量', check_result: i === 0 ? 'pass' : 'fail', check_standard: '公差±0.1mm', measured_value: i === 0 ? '10.05mm' : '10.15mm', notes: i === 0 ? '在公差内' : '超出公差' },
      ],
    }, meta('inspection', i));
    if (qi?.data?.id) {
      console.log(`    POST Inspection → ${qi.data.id} (${i === 0 ? 'pass' : 'conditional'})`);
      ctx.createdIds.set('quality-inspections', [...(ctx.createdIds.get('quality-inspections') ?? []), qi.data.id]);
      // Complete first inspection
      if (i === 0) {
        await api.safePut(`/api/quality-inspections/${qi.data.id}`, { status: 'completed' }, meta('inspection-complete', 0));
      }
    }
  }
  await api.safeGet('/api/quality-inspections', { _limit: 10 }, meta('qi-list', 0));
  await api.safeGet('/api/quality-inspection-findings', { _limit: 10 }, meta('qi-findings-list', 0));

  console.log(`    Phase 9 (${org}) done`);
}
