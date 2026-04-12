// scripts/seed/phases/phase2-opening-stock.ts
// Phase 2: Import opening stock balances

import type { SeedApiClient } from '../api-client';
import type { SeedProgress } from '../progress';

export async function runPhase2(
  client: SeedApiClient,
  progress: SeedProgress,
  stockRecords: Array<Record<string, unknown>>,
  orgName: string
): Promise<void> {
  progress.startPhase(`Phase 2: Opening Stock [${orgName}]`, stockRecords.length);

  const resp = await client.post('/api/admin/import/stock-records', {
    records: stockRecords,
    options: { upsert: true, dry_run: false, on_error: 'skip' },
  });

  const r = resp?.data;
  if (r) {
    for (let i = 0; i < (r.imported ?? 0); i++) progress.tick(true);
    for (let i = 0; i < (r.skipped ?? 0); i++) progress.tick(false);
  }

  progress.endPhase();
}
