// scripts/seed/phases/phase7-supporting.ts
// Phase 7: Contracts, fixed assets (already imported in phase1), exchange rates, budgets

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';
import type { IdRegistry } from '../id-registry';
import { randomAmount } from '../data/shared';

export async function runPhase7(
  client: SeedApiClient,
  progress: SeedProgress,
  registry: IdRegistry,
  contracts: Array<Record<string, unknown>>,
  orgName: string
): Promise<void> {
  // Contracts + budgets
  const totalOps = contracts.length + 2; // contracts + 2 budgets
  progress.startPhase(`Phase 7: Supporting [${orgName}]`, totalOps);

  // --- 7a: Contracts ---
  for (let i = 0; i < contracts.length; i++) {
    const { contract_type, customer_id, supplier_id, ...rest } = contracts[i] as any;

    const body: Record<string, unknown> = {
      ...rest,
      contract_type: contract_type ?? 'procurement',
      party_type: customer_id ? 'customer' : 'supplier',
      party_id: customer_id ?? supplier_id,
    };

    const resp = await client.safePost('/api/contracts', body, {
      phase: 'phase7', entity: 'contract', index: i,
    });
    progress.tick(!!resp?.data);
  }

  // --- 7b: Budgets ---
  const ccProd = registry.tryGet('cost_center', 'CC-PROD');
  const ccSales = registry.tryGet('cost_center', 'CC-SALES');
  const cogsAccountId = registry.tryGet('account', '6401');
  const sellingExpAccountId = registry.tryGet('account', '6601');

  if (ccProd && cogsAccountId) {
    const monthlyAmounts = Array.from({ length: 12 }, () => randomAmount(80000, 150000));
    const totalAmount = monthlyAmounts.reduce((s, a) => s + a, 0);

    const resp = await client.safePost('/api/budgets', {
      budget_name: 'FY2026 生产预算',
      budget_year: 2026,
      budget_type: 'annual',
      total_amount: +totalAmount.toFixed(2),
      currency: 'CNY',
      lines: monthlyAmounts.map((amount, idx) => ({
        account_code: '6401',
        planned_amount: +amount.toFixed(2),
        actual_amount: 0,
        cost_center_id: ccProd,
        period_month: idx + 1,
        description: `${idx + 1}月生产成本预算`,
      })),
    }, { phase: 'phase7', entity: 'budget', index: 0 });
    progress.tick(!!resp?.data);
  } else {
    progress.tick(false);
  }

  if (ccSales && sellingExpAccountId) {
    const monthlyAmounts = Array.from({ length: 12 }, () => randomAmount(30000, 80000));
    const totalAmount = monthlyAmounts.reduce((s, a) => s + a, 0);

    const resp = await client.safePost('/api/budgets', {
      budget_name: 'FY2026 销售费用预算',
      budget_year: 2026,
      budget_type: 'annual',
      total_amount: +totalAmount.toFixed(2),
      currency: 'CNY',
      lines: monthlyAmounts.map((amount, idx) => ({
        account_code: '6601',
        planned_amount: +amount.toFixed(2),
        actual_amount: 0,
        cost_center_id: ccSales,
        period_month: idx + 1,
        description: `${idx + 1}月销售费用预算`,
      })),
    }, { phase: 'phase7', entity: 'budget', index: 1 });
    progress.tick(!!resp?.data);
  } else {
    progress.tick(false);
  }

  progress.endPhase();
}
