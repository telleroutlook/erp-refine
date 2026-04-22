#!/usr/bin/env node
// scripts/seed-api-test.ts
// Comprehensive API seed & test — self-authenticating, exercises every endpoint
// Usage: npx tsx scripts/seed-api-test.ts [--api-url https://erp.3we.org] [--phases 0,1,2,...] [--verbose] [--org1-only] [--org2-only]

import { SeedApiClient } from './seed/api-client';
import { CoverageTracker } from './seed-test/coverage-tracker';
import { runPhase0 } from './seed-test/phases/phase-0-auth-utility';
import { runPhase1 } from './seed-test/phases/phase-1-master-crud';
import { runPhase2 } from './seed-test/phases/phase-2-partners-nested';
import { runPhase3 } from './seed-test/phases/phase-3-procurement-new';
import { runPhase4 } from './seed-test/phases/phase-4-procurement-extended';
import { runPhase5 } from './seed-test/phases/phase-5-sales-extended';
import { runPhase6 } from './seed-test/phases/phase-6-finance-extended';
import { runPhase7 } from './seed-test/phases/phase-7-inventory';
import { runPhase8 } from './seed-test/phases/phase-8-assets';
import { runPhase9 } from './seed-test/phases/phase-9-contracts-quality';
import { runPhase10 } from './seed-test/phases/phase-10-system';
import { runPhase11 } from './seed-test/phases/phase-11-admin';
import { runPhase12 } from './seed-test/phases/phase-12-admin-audit';
import { runPhase13 } from './seed-test/phases/phase-13-status-diversity';
import { runPhase14 } from './seed-test/phases/phase-14-update-delete';
import { runPhase15 } from './seed-test/phases/phase-15-schema-chat';

export interface TestContext {
  api: SeedApiClient;
  coverage: CoverageTracker;
  org1Token: string;
  org2Token: string;
  org1Id: string;
  org2Id: string;
  tokens: Map<string, string>;
  verbose: boolean;
  createdIds: Map<string, string[]>;
}

const PHASES = [
  { name: 'Phase 0: Auth & Utility', fn: runPhase0 },
  { name: 'Phase 1: Master Data CRUD', fn: runPhase1 },
  { name: 'Phase 2: Partners Nested', fn: runPhase2 },
  { name: 'Phase 3: Procurement + Workflow', fn: runPhase3 },
  { name: 'Phase 4: Procurement Extended', fn: runPhase4 },
  { name: 'Phase 5: Sales Extended', fn: runPhase5 },
  { name: 'Phase 6: Finance Extended', fn: runPhase6 },
  { name: 'Phase 7: Inventory', fn: runPhase7 },
  { name: 'Phase 8: Assets', fn: runPhase8 },
  { name: 'Phase 9: Contracts & Quality', fn: runPhase9 },
  { name: 'Phase 10: System', fn: runPhase10 },
  { name: 'Phase 11: Admin', fn: runPhase11 },
  { name: 'Phase 12: Admin Audit', fn: runPhase12 },
  { name: 'Phase 13: Status Diversity', fn: runPhase13 },
  { name: 'Phase 14: Update & Delete', fn: runPhase14 },
  { name: 'Phase 15: Schema & Chat', fn: runPhase15 },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const getArg = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const hasFlag = (name: string) => args.includes(`--${name}`);
  return {
    apiUrl: getArg('api-url') ?? 'https://erp.3we.org',
    phases: getArg('phases')?.split(',').map(Number) ?? PHASES.map((_, i) => i),
    verbose: hasFlag('verbose'),
    org1Only: hasFlag('org1-only'),
    org2Only: hasFlag('org2-only'),
  };
}

async function login(apiUrl: string, email: string, password: string): Promise<{ token: string; userId: string; orgId: string }> {
  const resp = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await resp.json() as any;
  if (!resp.ok) throw new Error(`Login failed for ${email}: ${json.error ?? JSON.stringify(json)}`);
  return {
    token: json.data.session.accessToken,
    userId: json.data.user.id,
    orgId: json.data.user.organizationId,
  };
}

async function main() {
  const config = parseArgs();
  console.log(`\n🏭 ERP API Seed & Test Script`);
  console.log(`   Target: ${config.apiUrl}`);
  console.log(`   Phases: ${config.phases.join(', ')}`);
  console.log(`   Verbose: ${config.verbose}\n`);

  // Authenticate
  console.log('🔐 Authenticating...');
  const org1Auth = await login(config.apiUrl, 'admin@erp.demo', 'Admin2026!');
  console.log(`   Org1 admin logged in (org: ${org1Auth.orgId})`);

  let org2Auth = { token: '', userId: '', orgId: '' };
  if (!config.org1Only) {
    org2Auth = await login(config.apiUrl, 'admin@tech.demo', 'Admin2026!');
    console.log(`   Org2 admin logged in (org: ${org2Auth.orgId})`);
  }

  const coverage = new CoverageTracker();
  const api = new SeedApiClient(config.apiUrl, org1Auth.token, config.verbose);
  api.onRequest = (method, path, status) => coverage.record(method, path, status);

  const ctx: TestContext = {
    api,
    coverage,
    org1Token: org1Auth.token,
    org2Token: org2Auth.token,
    org1Id: org1Auth.orgId,
    org2Id: org2Auth.orgId,
    tokens: new Map(),
    verbose: config.verbose,
    createdIds: new Map(),
  };

  const startTime = Date.now();
  let totalErrors = 0;

  for (const phaseIdx of config.phases) {
    if (phaseIdx >= PHASES.length) {
      console.log(`⚠️  Phase ${phaseIdx} does not exist, skipping`);
      continue;
    }
    const phase = PHASES[phaseIdx];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ ${phase.name}`);
    console.log('─'.repeat(60));
    const phaseStart = Date.now();
    api.clearErrors();

    try {
      // Run for Org1
      if (!config.org2Only) {
        api.setToken(org1Auth.token);
        console.log('  [Org1] Running...');
        await phase.fn(ctx, 'org1');
      }

      // Run for Org2 (lighter data)
      if (!config.org1Only && org2Auth.token) {
        api.setToken(org2Auth.token);
        console.log('  [Org2] Running...');
        await phase.fn(ctx, 'org2');
      }
    } catch (err) {
      console.log(`  ❌ Phase crashed: ${(err as Error).message}`);
    }

    const phaseErrors = api.getErrors();
    totalErrors += phaseErrors.length;
    const elapsed = ((Date.now() - phaseStart) / 1000).toFixed(1);
    console.log(`  ✓ ${phase.name} done in ${elapsed}s (${phaseErrors.length} errors)`);
    if (phaseErrors.length > 0) {
      for (const e of phaseErrors.slice(0, 5)) {
        console.log(`    ⚠ ${e.entity}#${e.index}: ${e.message.slice(0, 120)}`);
      }
      if (phaseErrors.length > 5) console.log(`    ... and ${phaseErrors.length - 5} more`);
    }
  }

  // Reset to org1 token
  api.setToken(org1Auth.token);

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  COMPLETE — ${totalElapsed}s total, ${totalErrors} errors`);
  coverage.printReport();

  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
