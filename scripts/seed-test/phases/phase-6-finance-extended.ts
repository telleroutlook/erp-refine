// Phase 6: Finance Extended — Payment Records, Voucher Workflow, Budget Lines
import type { TestContext } from '../../seed-api-test';

const P = 'phase6';

export async function runPhase6(ctx: TestContext, org: string): Promise<void> {
  const { api } = ctx;
  const isOrg2 = org === 'org2';
  const meta = (e: string, i: number) => ({ phase: P, entity: e, index: i });

  // Lookups
  const sups = await api.safeGet<any>('/api/suppliers', { _limit: 3 }, meta('sup-lookup', 0));
  const supIds = (sups?.data ?? []).map((s: any) => s.id);
  const custs = await api.safeGet<any>('/api/customers', { _limit: 3 }, meta('cust-lookup', 0));
  const custIds = (custs?.data ?? []).map((c: any) => c.id);
  const supInvs = await api.safeGet<any>('/api/supplier-invoices', { _limit: 3 }, meta('supinv-lookup', 0));
  const salesInvs = await api.safeGet<any>('/api/sales-invoices', { _limit: 3 }, meta('salesinv-lookup', 0));
  const accts = await api.safeGet<any>('/api/account-subjects', { _limit: 5 }, meta('acct-lookup', 0));
  const acctIds = (accts?.data ?? []).map((a: any) => a.id);

  // --- Payment Records ---
  const paymentRecords = [
    { payment_type: 'payable', partner_type: 'supplier', partner_id: supIds[0], amount: 5000, payment_method: 'bank_transfer', reference_type: 'supplier_invoice', reference_id: supInvs?.data?.[0]?.id },
    { payment_type: 'payable', partner_type: 'supplier', partner_id: supIds[0], amount: 3000, payment_method: 'check', reference_type: 'payment_request' },
    { payment_type: 'receivable', partner_type: 'customer', partner_id: custIds[0], amount: 8000, payment_method: 'bank_transfer', reference_type: 'sales_invoice', reference_id: salesInvs?.data?.[0]?.id },
    { payment_type: 'payable', partner_type: 'supplier', partner_id: supIds[0], amount: 1500, payment_method: 'cash' },
  ];

  for (let i = 0; i < paymentRecords.length; i++) {
    const pr = paymentRecords[i];
    if (!pr.partner_id) continue;
    const result = await api.safePost<any>('/api/payment-records', {
      ...pr,
      payment_number: `PAY-API-${Date.now()}-${i}`,
      payment_date: `2026-04-${String(18 + i).padStart(2, '0')}`,
    }, meta('payment-record', i));
    if (result?.data?.id) {
      console.log(`    POST Payment Record → ${result.data.id} (${pr.payment_type})`);
      ctx.createdIds.set('payment-records', [...(ctx.createdIds.get('payment-records') ?? []), result.data.id]);
    }
  }
  await api.safeGet('/api/payment-records', { _limit: 10 }, meta('payment-records-list', 0));

  // --- Payment Requests with Workflow ---
  const prCount = isOrg2 ? 2 : 3;
  const prIds: string[] = [];
  for (let i = 0; i < prCount; i++) {
    const pr = await api.safePost<any>('/api/payment-requests', {
      supplier_id: supIds[i % supIds.length],
      supplier_invoice_id: supInvs?.data?.[i % (supInvs?.data?.length ?? 1)]?.id,
      amount: 2000 + i * 1000,
      payment_method: 'bank_transfer',
      due_date: `2026-05-${String(20 + i).padStart(2, '0')}`,
      notes: `API seed payment request #${i + 1}`,
    }, meta('payment-req', i));
    if (pr?.data?.id) {
      prIds.push(pr.data.id);
      console.log(`    POST Payment Request → ${pr.data.id}`);
    }
  }

  // Workflow: submit all, approve 1, reject 1, leave 1 submitted
  for (const id of prIds) {
    await api.safePost(`/api/payment-requests/${id}/submit`, {}, meta('pr-submit', 0));
  }
  if (prIds.length >= 1) {
    await api.safePost(`/api/payment-requests/${prIds[0]}/approve`, {}, meta('pr-approve', 0));
  }
  if (prIds.length >= 3) {
    await api.safePost(`/api/payment-requests/${prIds[2]}/reject`, { reason: 'Duplicate request' }, meta('pr-reject', 0));
  }
  await api.safeGet('/api/payment-requests', { _limit: 10 }, meta('pr-list', 0));

  // --- Vouchers with Workflow ---
  if (acctIds.length >= 2) {
    const voucherIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      const amount = 10000 + i * 5000;
      const v = await api.safePost<any>('/api/vouchers', {
        voucher_date: `2026-04-${String(20 + i).padStart(2, '0')}`,
        voucher_type: i === 0 ? 'payment' : 'receipt',
        notes: `API seed voucher #${i + 1}`,
        entries: [
          { account_subject_id: acctIds[0], entry_type: 'debit', amount, summary: '借方' },
          { account_subject_id: acctIds[1], entry_type: 'credit', amount, summary: '贷方' },
        ],
      }, meta('voucher-create', i));
      if (v?.data?.id) {
        voucherIds.push(v.data.id);
        console.log(`    POST Voucher → ${v.data.id}`);
        ctx.createdIds.set('vouchers', [...(ctx.createdIds.get('vouchers') ?? []), v.data.id]);
      }
    }

    // Post one voucher
    if (voucherIds.length >= 1) {
      // First approve, then post
      await api.safePut(`/api/vouchers/${voucherIds[0]}`, { status: 'posted' }, meta('voucher-post', 0));
      console.log(`    Voucher ${voucherIds[0]} → posted`);
    }
  }

  await api.safeGet('/api/vouchers', { _limit: 10 }, meta('voucher-list', 0));
  await api.safeGet('/api/voucher-entries', { _limit: 10 }, meta('voucher-entries-list', 0));

  // --- Budgets ---
  const budgets = await api.safeGet<any>('/api/budgets', { _limit: 3 }, meta('budget-lookup', 0));
  if (budgets?.data?.[0]) {
    await api.safeGet(`/api/budgets/${budgets.data[0].id}`, undefined, meta('budget-get', 0));
  }
  await api.safeGet('/api/budget-lines', { _limit: 10 }, meta('budget-lines-list', 0));

  // Create a new budget
  if (acctIds.length > 0) {
    const budget = await api.safePost<any>('/api/budgets', {
      name: isOrg2 ? '2026年度预算-T' : '2026年度预算-API',
      budget_type: 'annual',
      fiscal_year: 2026,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'draft',
      notes: 'API seed budget',
      items: [
        { account_subject_id: acctIds[0], budget_amount: 500000, period: '2026-Q1', notes: 'Q1 预算' },
        { account_subject_id: acctIds[0], budget_amount: 600000, period: '2026-Q2', notes: 'Q2 预算' },
      ],
    }, meta('budget-create', 0));
    if (budget?.data?.id) {
      console.log(`    POST Budget → ${budget.data.id}`);
    }
  }

  console.log(`    Phase 6 (${org}) done`);
}
