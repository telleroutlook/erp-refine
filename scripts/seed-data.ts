#!/usr/bin/env node
// scripts/seed-data.ts
// ERP-Refine comprehensive data seeder
// Usage: npx tsx scripts/seed-data.ts --api-url http://localhost:8787 --token <admin-jwt> [--dry-run] [--phases 1,2,3] [--clean]
//
// This script creates rich demo data for 2 organizations spanning 6 months of business history.
// All data is created through the API layer to ensure validation, audit trails, and business rules.

import { SeedApiClient } from './seed/api-client';
import { IdRegistry } from './seed/id-registry';
import { SeedProgress } from './seed/progress';
import { createEmptyContext, type SeedConfig, type OrgConfig, type SeedReport } from './seed/types';

// Phase imports
import { runPhase1 } from './seed/phases/phase1-master-data';
import { runPhase2 } from './seed/phases/phase2-opening-stock';
import { runPhase3 } from './seed/phases/phase3-documents';
import { runPhase4 } from './seed/phases/phase4-workflows';
import { runPhase5 } from './seed/phases/phase5-finance';
import { runPhase6 } from './seed/phases/phase6-manufacturing';
import { runPhase7 } from './seed/phases/phase7-supporting';

// Data generators — Org1
import {
  org1Departments, org1Employees, org1ProductCategories,
  org1Products, org1Customers, org1Suppliers, org1Warehouses, org1StorageLocations,
  org1AccountSubjects, org1CostCenters, org1DefectCodes,
  org1ExchangeRates, org1FixedAssets,
} from './seed/data/org1-master';
import {
  generateOrg1PurchaseOrders, generateOrg1SalesOrders,
  generateOrg1StockRecords, generateOrg1BOMs, generateOrg1Contracts,
} from './seed/data/org1-transactions';

// Data generators — Org2
import {
  org2Departments, org2Employees, org2ProductCategories,
  org2Products, org2Customers, org2Suppliers, org2Warehouses,
  org2AccountSubjects, org2CostCenters, org2ExchangeRates,
} from './seed/data/org2-master';
import {
  generateOrg2PurchaseOrders, generateOrg2SalesOrders, generateOrg2StockRecords,
} from './seed/data/org2-transactions';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): SeedConfig {
  const args = process.argv.slice(2);

  function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? args[idx + 1] : undefined;
  }
  function hasFlag(name: string): boolean {
    return args.includes(`--${name}`);
  }

  const apiUrl = getArg('api-url') ?? 'http://localhost:8787';
  const token = getArg('token') ?? process.env.ADMIN_TOKEN ?? '';
  const token2 = getArg('token2') ?? process.env.ADMIN_TOKEN2 ?? '';
  const dryRun = hasFlag('dry-run');
  const clean = hasFlag('clean');
  const verbose = hasFlag('verbose');
  const org1Only = hasFlag('org1-only');
  const org2Only = hasFlag('org2-only');
  const phasesStr = getArg('phases');
  const phases = phasesStr ? phasesStr.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7];

  if (!token) {
    console.error('Usage: npx tsx scripts/seed-data.ts --api-url <url> --token <admin-jwt> [--token2 <org2-jwt>] [--dry-run] [--phases 1,2,3] [--clean] [--verbose] [--org1-only] [--org2-only]');
    console.error('  Or set ADMIN_TOKEN / ADMIN_TOKEN2 env vars');
    process.exit(1);
  }

  if (hasFlag('help')) {
    console.log(`
ERP-Refine Seed Data Generator

Usage:
  npx tsx scripts/seed-data.ts [options]

Options:
  --api-url <url>   API base URL (default: http://localhost:8787)
  --token <jwt>     Admin JWT token (or set ADMIN_TOKEN env)
  --dry-run         Validate only, don't insert data
  --phases <list>   Comma-separated phases to run (1-7, default: all)
  --clean           Delete existing seed data before running (not yet implemented)
  --verbose         Show detailed API call logs
  --help            Show this help message

Phases:
  1 - Master data (departments, products, customers, etc.)
  2 - Opening stock balances
  3 - Create POs and SOs via atomic API
  4 - Workflow actions (receipt confirm, shipment confirm)
  5 - Finance (invoices, vouchers, payments)
  6 - Manufacturing (BOMs, work orders, QC)
  7 - Supporting (contracts, budgets)
`);
    process.exit(0);
  }

  return { apiUrl, token, token2, dryRun, phases, clean, verbose, org1Only, org2Only };
}

// ---------------------------------------------------------------------------
// Organization configurations
// ---------------------------------------------------------------------------

const ORG1: OrgConfig = {
  organizationId: '00000000-0000-0000-0000-000000000001',
  name: '默认组织 (DEFAULT)',
  token: '', // set from config
};

const ORG2: OrgConfig = {
  organizationId: '00000000-0000-0000-0000-000000000002',
  name: 'Tech Innovation Inc (TECH)',
  token: '', // set from config
};

// ---------------------------------------------------------------------------
// Seed one organization
// ---------------------------------------------------------------------------

async function seedOrganization(
  org: OrgConfig,
  config: SeedConfig,
  isOrg1: boolean
): Promise<SeedReport> {
  const startedAt = new Date();
  const client = new SeedApiClient(config.apiUrl, org.token, config.verbose);
  const registry = new IdRegistry();
  const progress = new SeedProgress();
  const ctx = createEmptyContext(org, config);

  console.log(`\n\n========================================`);
  console.log(`  Seeding: ${org.name}`);
  console.log(`  Org ID:  ${org.organizationId}`);
  console.log(`  Mode:    ${config.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Phases:  ${config.phases.join(', ')}`);
  console.log(`========================================`);

  // --- Phase 1: Master Data ---
  if (config.phases.includes(1)) {
    if (isOrg1) {
      // Strip parent_code from departments (import engine handles flat)
      const depts = org1Departments().map(({ parent_code, ...rest }: any) => rest);
      await runPhase1(client, registry, progress, {
        departments: depts,
        employees: org1Employees(),
        'product-categories': org1ProductCategories(),
        products: org1Products() as any,
        customers: org1Customers(),
        suppliers: org1Suppliers(),
        warehouses: org1Warehouses(),
        'account-subjects': org1AccountSubjects(),
        'cost-centers': org1CostCenters(),
        'defect-codes': org1DefectCodes(),
        'exchange-rates': org1ExchangeRates(),
        'fixed-assets': org1FixedAssets(),
      }, org.name);
    } else {
      await runPhase1(client, registry, progress, {
        departments: org2Departments(),
        employees: org2Employees(),
        'product-categories': org2ProductCategories(),
        products: org2Products() as any,
        customers: org2Customers(),
        suppliers: org2Suppliers(),
        warehouses: org2Warehouses(),
        'account-subjects': org2AccountSubjects(),
        'cost-centers': org2CostCenters(),
        'exchange-rates': org2ExchangeRates(),
      }, org.name);
    }
  } else {
    // Even if skipping phase 1, we still need ID maps for later phases
    console.log('\n  Preloading ID maps (phase 1 skipped)...');
    await registry.preloadAll(client);
  }

  // --- Phase 2: Opening Stock ---
  if (config.phases.includes(2)) {
    const stockRecords = isOrg1
      ? generateOrg1StockRecords(registry)
      : generateOrg2StockRecords(registry);
    await runPhase2(client, progress, stockRecords, org.name);
  }

  // --- Phase 3: Create Documents (POs + SOs) ---
  if (config.phases.includes(3)) {
    const purchaseOrders = isOrg1
      ? generateOrg1PurchaseOrders(registry)
      : generateOrg2PurchaseOrders(registry);
    const salesOrders = isOrg1
      ? generateOrg1SalesOrders(registry)
      : generateOrg2SalesOrders(registry);

    const { createdPOs, createdSOs } = await runPhase3(
      client, progress, purchaseOrders, salesOrders, org.name
    );
    ctx.purchaseOrders = createdPOs;
    ctx.salesOrders = createdSOs;
  }

  // --- Phase 4: Workflows (receipts, shipments, status transitions) ---
  if (config.phases.includes(4) && ctx.purchaseOrders.length > 0) {
    const { confirmedReceipts, confirmedShipments } = await runPhase4(
      client, progress, registry,
      ctx.purchaseOrders, ctx.salesOrders, org.name
    );
    ctx.purchaseReceipts = confirmedReceipts;
    ctx.salesShipments = confirmedShipments;
  }

  // --- Phase 5: Finance ---
  if (config.phases.includes(5) && (ctx.purchaseReceipts.length > 0 || ctx.salesShipments.length > 0)) {
    const { supplierInvoices, salesInvoices } = await runPhase5(
      client, progress, registry,
      ctx.purchaseReceipts, ctx.salesShipments,
      ctx.purchaseOrders, ctx.salesOrders, org.name
    );
    ctx.supplierInvoices = supplierInvoices;
    ctx.salesInvoices = salesInvoices;
  }

  // --- Phase 6: Manufacturing & QC (Org1 only) ---
  if (config.phases.includes(6) && isOrg1) {
    const bomData = generateOrg1BOMs(registry);
    await runPhase6(client, progress, registry, bomData, ctx.purchaseReceipts, org.name);
  }

  // --- Phase 7: Supporting (contracts, budgets) ---
  if (config.phases.includes(7)) {
    const contracts = isOrg1 ? generateOrg1Contracts(registry) : [];
    await runPhase7(client, progress, registry, contracts, org.name);
  }

  return progress.getReport(org.name, startedAt);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const config = parseArgs();
  const progressTracker = new SeedProgress();
  const reports: SeedReport[] = [];

  console.log('=== ERP-Refine Seed Data Generator ===');
  console.log(`API: ${config.apiUrl}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (validation only)' : 'LIVE INSERT'}`);
  console.log(`Phases: ${config.phases.join(', ')}`);

  // Use the same token for both orgs (admin should have access to both)
  // Or separate tokens if provided
  ORG1.token = config.token;
  ORG2.token = config.token2 || config.token;

  // Seed Org1
  if (!config.org2Only) {
    try {
      const report1 = await seedOrganization(ORG1, config, true);
      reports.push(report1);
    } catch (err) {
      console.error(`\nFATAL ERROR seeding Org1:`, (err as Error).message);
      if (config.verbose) console.error(err);
    }
  }

  // Seed Org2
  if (!config.org1Only) {
    try {
      const report2 = await seedOrganization(ORG2, config, false);
      reports.push(report2);
    } catch (err) {
      console.error(`\nFATAL ERROR seeding Org2:`, (err as Error).message);
      if (config.verbose) console.error(err);
    }
  }

  // Print summary
  progressTracker.printSummary(reports);

  if (config.dryRun) {
    console.log('*** DRY RUN — no data was actually inserted ***');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
