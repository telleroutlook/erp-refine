/**
 * Seed V3: Supplement existing data with previously-missing entities.
 *
 * Usage:
 *   npx tsx scripts/seed-v3/run.ts [--base-url=https://erp.3we.org] [--only=<phase>]
 *
 * Phase names: missing-master, procurement-flows, inventory, sales-returns, org2-complete
 */
import { SeedClient } from '../seed-v2/client';
import { seedMissingMaster } from './phase-missing-master';
import { seedProcurementFlows } from './phase-procurement-flows';
import { seedInventory } from './phase-inventory';
import { seedSalesReturns } from './phase-sales-returns';
import { seedOrg2Complete } from './phase-org2-complete';

const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] ?? 'https://erp.3we.org';
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];
const PASSWORD = 'Admin2026!';

async function main() {
  console.log('\n=== Seed V3: Supplemental data via API ===');
  console.log(`Base URL: ${BASE_URL}`);
  if (ONLY) console.log(`Only running phase: ${ONLY}`);

  const runPhase = (name: string) => !ONLY || ONLY === name;

  const org1 = new SeedClient(BASE_URL);
  await org1.login('admin@erp.demo', PASSWORD);

  const org2 = new SeedClient(BASE_URL);
  await org2.login('admin@tech.demo', PASSWORD);

  if (runPhase('missing-master')) {
    console.log('\n── Phase 1: Missing Master Data ───────────────────');
    await seedMissingMaster(org1, 'org1');
    await seedMissingMaster(org2, 'org2');
  }

  if (runPhase('procurement-flows')) {
    console.log('\n── Phase 2: Procurement Flows ──────────────────────');
    await seedProcurementFlows(org1, 'org1');
    await seedProcurementFlows(org2, 'org2');
  }

  if (runPhase('inventory')) {
    console.log('\n── Phase 3: Inventory ──────────────────────────────');
    await seedInventory(org1, 'org1');
    await seedInventory(org2, 'org2');
  }

  if (runPhase('sales-returns')) {
    console.log('\n── Phase 4: Sales Returns ──────────────────────────');
    await seedSalesReturns(org1, 'org1');
    await seedSalesReturns(org2, 'org2');
  }

  if (runPhase('org2-complete')) {
    console.log('\n── Phase 5: Org2 Complete ──────────────────────────');
    await seedOrg2Complete(org2);
  }

  console.log('\n=== Seed V3 Complete ===');
}

main().catch(err => {
  console.error('\nSEED V3 FAILED:', err.message ?? err);
  process.exit(1);
});
