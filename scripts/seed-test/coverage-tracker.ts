// scripts/seed-test/coverage-tracker.ts
// Tracks API endpoint coverage during seed testing

export interface EndpointRecord {
  count: number;
  statuses: number[];
  firstCalledAt: Date;
}

export class CoverageTracker {
  private called = new Map<string, EndpointRecord>();
  private knownEndpoints: string[];

  constructor() {
    this.knownEndpoints = buildKnownEndpoints();
  }

  record(method: string, rawPath: string, status: number): void {
    const pattern = normalizePath(method, rawPath);
    const existing = this.called.get(pattern);
    if (existing) {
      existing.count++;
      if (!existing.statuses.includes(status)) existing.statuses.push(status);
    } else {
      this.called.set(pattern, { count: 1, statuses: [status], firstCalledAt: new Date() });
    }
  }

  getReport() {
    const calledPatterns = new Set(this.called.keys());
    const uncalled = this.knownEndpoints.filter((e) => !calledPatterns.has(e));
    const errors: Array<{ endpoint: string; status: number; count: number }> = [];
    for (const [ep, rec] of this.called) {
      for (const s of rec.statuses) {
        if (s >= 400) errors.push({ endpoint: ep, status: s, count: rec.count });
      }
    }
    return {
      total: this.knownEndpoints.length,
      called: calledPatterns.size,
      uncalled,
      coverage: this.knownEndpoints.length > 0
        ? Math.round((calledPatterns.size / this.knownEndpoints.length) * 100)
        : 0,
      errors,
      details: this.called,
    };
  }

  printReport(): void {
    const r = this.getReport();
    console.log('\n══════════════════════════════════════════════');
    console.log('  API ENDPOINT COVERAGE REPORT');
    console.log('══════════════════════════════════════════════');
    console.log(`  Called:   ${r.called} unique endpoint patterns`);
    console.log(`  Known:    ${r.total} cataloged endpoints`);
    console.log(`  Coverage: ${r.coverage}%`);
    if (r.errors.length > 0) {
      console.log(`  Errors:   ${r.errors.length} endpoints returned 4xx/5xx`);
    }
    if (r.uncalled.length > 0 && r.uncalled.length <= 30) {
      console.log('\n  Uncalled endpoints:');
      for (const e of r.uncalled) console.log(`    - ${e}`);
    } else if (r.uncalled.length > 30) {
      console.log(`\n  ${r.uncalled.length} uncalled endpoints (too many to list)`);
    }
    console.log('══════════════════════════════════════════════\n');
  }
}

function normalizePath(method: string, rawPath: string): string {
  const path = rawPath
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/api\/admin\/import\/templates\/[^/]+/, '/api/admin/import/templates/:entity');
  return `${method.toUpperCase()} ${path}`;
}

function buildKnownEndpoints(): string[] {
  const endpoints: string[] = [];
  const add = (method: string, path: string) => endpoints.push(`${method} ${path}`);

  // Auth
  add('POST', '/api/auth/login');
  add('POST', '/api/auth/logout');
  add('POST', '/api/auth/refresh');
  add('GET', '/api/auth/me');

  // Utility
  add('GET', '/health');
  add('GET', '/api');
  add('GET', '/api/docs');
  add('GET', '/api/openapi.json');

  // Schema
  for (const m of ['GET', 'POST']) add(m, '/api/schema');
  add('GET', '/api/schema/:id');

  // CRUD resources — each gets GET list, GET/:id, POST, PUT/:id, DELETE/:id
  const crudResources = [
    'products', 'product-categories', 'warehouses', 'warehouse-locations',
    'tax-codes', 'units-of-measure', 'carriers', 'price-lists', 'price-list-lines',
    'departments', 'employees', 'organizations', 'exchange-rates', 'number-sequences',
    'account-subjects', 'cost-centers',
    'customers', 'suppliers',
    'purchase-orders', 'purchase-order-items',
    'purchase-requisitions', 'purchase-requisition-lines',
    'rfq-headers', 'rfq-lines',
    'supplier-quotations', 'supplier-quotation-lines',
    'purchase-receipts', 'purchase-receipt-items',
    'supplier-invoices', 'supplier-invoice-items',
    'advance-shipment-notices', 'asn-lines',
    'reconciliation-statements', 'reconciliation-lines',
    'sales-orders', 'sales-order-items',
    'sales-shipments', 'sales-shipment-items',
    'sales-returns', 'sales-return-items',
    'sales-invoices', 'sales-invoice-items',
    'customer-receipts', 'sales-return-credits',
    'payment-requests', 'payment-records',
    'vouchers', 'voucher-entries',
    'budgets', 'budget-lines',
    'bom-headers', 'bom-items',
    'work-orders', 'work-order-lines',
    'production-reports',
    'defect-codes', 'quality-standards', 'quality-standard-items',
    'quality-inspections', 'quality-inspection-findings',
    'contracts', 'contract-items', 'contract-milestones',
    'fixed-assets', 'asset-depreciations', 'asset-maintenance',
    'inventory-lots', 'serial-numbers', 'inventory-reservations',
    'inventory-counts', 'inventory-count-lines',
    'stock-records', 'stock-transactions',
    'document-attachments', 'document-relations',
    'dynamic-form-data', 'profile-change-requests',
    'shipment-tracking-events',
  ];
  for (const r of crudResources) {
    add('GET', `/api/${r}`);
    add('GET', `/api/${r}/:id`);
    add('POST', `/api/${r}`);
    add('PUT', `/api/${r}/:id`);
    add('DELETE', `/api/${r}/:id`);
  }

  // Nested routes
  const nestedRoutes = [
    { parent: 'customers', child: 'addresses' },
    { parent: 'customers', child: 'bank-accounts' },
    { parent: 'suppliers', child: 'sites' },
    { parent: 'suppliers', child: 'bank-accounts' },
    { parent: 'suppliers', child: 'contacts' },
    { parent: 'suppliers', child: 'certificates' },
  ];
  for (const { parent, child } of nestedRoutes) {
    const base = `/api/${parent}/:id/${child}`;
    add('GET', base);
    add('GET', `${base}/:id`);
    add('POST', base);
    add('PUT', `${base}/:id`);
    add('DELETE', `${base}/:id`);
  }

  // Workflow endpoints
  add('POST', '/api/purchase-orders/:id/submit');
  add('POST', '/api/purchase-orders/:id/approve');
  add('POST', '/api/purchase-orders/:id/reject');
  add('POST', '/api/purchase-requisitions/:id/submit');
  add('POST', '/api/purchase-requisitions/:id/approve');
  add('POST', '/api/purchase-requisitions/:id/reject');
  add('POST', '/api/purchase-receipts/:id/confirm');
  add('POST', '/api/sales-orders/:id/submit');
  add('POST', '/api/sales-orders/:id/approve');
  add('POST', '/api/sales-orders/:id/reject');
  add('POST', '/api/sales-shipments/:id/confirm');
  add('POST', '/api/work-orders/:id/start');
  add('POST', '/api/work-orders/:id/complete');
  add('POST', '/api/work-orders/:id/close');

  // Three-way match
  add('GET', '/api/three-way-match');
  add('POST', '/api/three-way-match');

  // AR aging
  add('GET', '/api/ar-aging');
  add('GET', '/api/ar-aging/:id');

  // Notifications
  add('GET', '/api/notifications');
  add('GET', '/api/notifications/:id');
  add('POST', '/api/notifications/:id/read');
  add('POST', '/api/notifications/read-all');

  // Workflows / workflow-steps
  add('GET', '/api/workflows');
  add('GET', '/api/workflows/:id');
  add('GET', '/api/workflow-steps');
  add('GET', '/api/workflow-steps/:id');

  // Message feedback
  add('GET', '/api/message-feedback');
  add('GET', '/api/message-feedback/:id');
  add('POST', '/api/message-feedback');

  // Approval records (public)
  add('GET', '/api/approval-records');
  add('GET', '/api/approval-records/:id');

  // Admin CRUD
  const adminCrud = [
    'approval-rules', 'approval-rule-steps',
    'roles', 'role-permissions', 'user-roles',
  ];
  for (const r of adminCrud) {
    add('GET', `/api/admin/${r}`);
    add('GET', `/api/admin/${r}/:id`);
    add('POST', `/api/admin/${r}`);
    add('PUT', `/api/admin/${r}/:id`);
    add('DELETE', `/api/admin/${r}/:id`);
  }

  // Admin read-only audit
  const adminAudit = [
    'approval-records', 'token-usage', 'tool-call-metrics',
    'agent-sessions', 'agent-decisions', 'business-events',
    'auth-events', 'failed-login-attempts', 'import-logs',
    'portal-users', 'semantic-metadata', 'component-whitelist', 'schema-versions',
  ];
  for (const r of adminAudit) {
    add('GET', `/api/admin/${r}`);
    add('GET', `/api/admin/${r}/:id`);
  }

  // Admin import
  add('GET', '/api/admin/import');
  add('GET', '/api/admin/import/templates');
  add('GET', '/api/admin/import/templates/:entity');
  add('POST', '/api/admin/link-employees');

  // Storage
  add('POST', '/api/storage/upload');
  add('GET', '/api/storage/download/:id');
  add('DELETE', '/api/storage/:id');

  // Chat
  add('POST', '/api/chat');
  add('POST', '/api/chat/stream');

  return [...new Set(endpoints)];
}
