/**
 * Seed V2: Rebuild all transaction data via API calls.
 * Ensures document flow consistency by using the same API endpoints as the frontend.
 *
 * Usage: npx tsx scripts/seed-v2/run.ts [--base-url=https://erp.3we.org] [--only=org1-o2c]
 */

import { SeedClient } from './client';
import { seedOrg1P2P, seedOrg1O2C } from './org1-flows';
import { seedOrg2 } from './org2-flows';

const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] ?? 'https://erp.3we.org';
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];
const PASSWORD = 'Admin2026!';

async function main() {
  console.log(`\n=== Seed V2: Rebuilding transaction data via API ===`);
  console.log(`Base URL: ${BASE_URL}`);
  if (ONLY) console.log(`Only: ${ONLY}`);
  console.log('');

  // Org1: 默认组织
  if (!ONLY || ONLY.startsWith('org1')) {
    console.log('── Org1 (默认组织) ─────────────────────────────────');
    const org1Client = new SeedClient(BASE_URL);
    await org1Client.login('admin@erp.demo', PASSWORD);

    if (!ONLY || ONLY === 'org1-p2p' || ONLY === 'org1') {
      await seedOrg1P2P(org1Client);
    }
    if (!ONLY || ONLY === 'org1-o2c' || ONLY === 'org1') {
      await seedOrg1O2C(org1Client);
    }
  }

  // Org2: Tech Innovation Inc
  if (!ONLY || ONLY.startsWith('org2')) {
    console.log('\n── Org2 (Tech Innovation Inc) ───────────────────────');
    const org2Client = new SeedClient(BASE_URL);
    await org2Client.login('admin@tech.demo', PASSWORD);
    await seedOrg2(org2Client);
  }

  console.log('\n=== Seed V2 Complete ===');
}

main().catch((err) => {
  console.error('\n❌ SEED FAILED:', err.message ?? err);
  process.exit(1);
});
