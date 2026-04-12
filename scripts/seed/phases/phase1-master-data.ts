// scripts/seed/phases/phase1-master-data.ts
// Phase 1: Import master data via /api/admin/import-batch, then preload ID maps

import type { SeedApiClient } from '../api-client';
import type { IdRegistry } from '../id-registry';
import type { SeedProgress } from '../progress';

interface MasterDataSet {
  departments: Record<string, unknown>[];
  employees: Record<string, unknown>[];
  'product-categories': Record<string, unknown>[];
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  warehouses: Record<string, unknown>[];
  'account-subjects': Record<string, unknown>[];
  'cost-centers': Record<string, unknown>[];
  'defect-codes'?: Record<string, unknown>[];
  'exchange-rates'?: Record<string, unknown>[];
  'fixed-assets'?: Record<string, unknown>[];
}

export async function runPhase1(
  client: SeedApiClient,
  registry: IdRegistry,
  progress: SeedProgress,
  masterData: MasterDataSet,
  orgName: string
): Promise<void> {
  // Count total records
  const totalRecords = Object.values(masterData).reduce((s, arr) => s + (arr?.length ?? 0), 0);
  progress.startPhase(`Phase 1: Master Data [${orgName}]`, totalRecords);

  // Step 1: Import foundation & structure first (departments, categories, accounts)
  const batch1: Record<string, Record<string, unknown>[]> = {};
  const batch1Keys = ['departments', 'product-categories', 'account-subjects', 'cost-centers', 'defect-codes'] as const;
  for (const key of batch1Keys) {
    const data = masterData[key as keyof MasterDataSet];
    if (data && data.length > 0) batch1[key] = data;
  }

  if (Object.keys(batch1).length > 0) {
    const resp = await client.post('/api/admin/import-batch', {
      data: batch1,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logBatchResult(resp, progress);
  }

  // Step 2: Import employees (depends on departments)
  if (masterData.employees.length > 0) {
    const resp = await client.post('/api/admin/import/employees', {
      records: masterData.employees,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logSingleResult(resp, progress);
  }

  // Step 3: Import partners
  const batch2: Record<string, Record<string, unknown>[]> = {};
  if (masterData.customers.length > 0) batch2.customers = masterData.customers;
  if (masterData.suppliers.length > 0) batch2.suppliers = masterData.suppliers;

  if (Object.keys(batch2).length > 0) {
    const resp = await client.post('/api/admin/import-batch', {
      data: batch2,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logBatchResult(resp, progress);
  }

  // Step 4: Import warehouses
  const batch3: Record<string, Record<string, unknown>[]> = {};
  if (masterData.warehouses.length > 0) batch3.warehouses = masterData.warehouses;

  if (Object.keys(batch3).length > 0) {
    const resp = await client.post('/api/admin/import-batch', {
      data: batch3,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logBatchResult(resp, progress);
  }

  // Step 5: Import products (depends on categories)
  if (masterData.products.length > 0) {
    // Strip _meta field from products
    const cleanProducts = masterData.products.map((p) => {
      const { _meta, ...rest } = p as any;
      return rest;
    });
    const resp = await client.post('/api/admin/import/products', {
      records: cleanProducts,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logSingleResult(resp, progress);
  }

  // Step 6: Import exchange rates and fixed assets
  const batch4: Record<string, Record<string, unknown>[]> = {};
  if (masterData['exchange-rates'] && masterData['exchange-rates'].length > 0) {
    batch4['exchange-rates'] = masterData['exchange-rates'];
  }
  if (masterData['fixed-assets'] && masterData['fixed-assets'].length > 0) {
    batch4['fixed-assets'] = masterData['fixed-assets'];
  }

  if (Object.keys(batch4).length > 0) {
    const resp = await client.post('/api/admin/import-batch', {
      data: batch4,
      options: { upsert: true, dry_run: false, on_error: 'skip' },
    });
    logBatchResult(resp, progress);
  }

  // Step 7: Preload all code→ID maps
  console.log('\n  Preloading ID maps...');
  const counts = await registry.preloadAll(client);
  for (const [entity, count] of Object.entries(counts)) {
    if (count > 0) console.log(`    ${entity}: ${count} records`);
  }

  progress.endPhase();
}

function logBatchResult(resp: any, progress: SeedProgress): void {
  if (resp?.data?.results) {
    for (const r of resp.data.results) {
      for (let i = 0; i < r.imported; i++) progress.tick(true);
      for (let i = 0; i < r.skipped; i++) progress.tick(false);
    }
  }
}

function logSingleResult(resp: any, progress: SeedProgress): void {
  const r = resp?.data;
  if (r) {
    for (let i = 0; i < (r.imported ?? 0); i++) progress.tick(true);
    for (let i = 0; i < (r.skipped ?? 0); i++) progress.tick(false);
  }
}
