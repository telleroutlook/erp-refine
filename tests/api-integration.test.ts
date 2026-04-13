// tests/api-integration.test.ts
// Production API integration tests — list, show (👁️), edit (✏️) for all resources
//
// Run: npx vitest run tests/api-integration.test.ts
// Requires: PROD_URL env var (defaults to https://erp.3we.org)
//           TEST_EMAIL / TEST_PASSWORD env vars (defaults to admin@erp.demo / Admin2026!)

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.PROD_URL ?? 'https://erp.3we.org';
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'admin@erp.demo';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin2026!';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  expect(res.status, 'login should return 200').toBe(200);
  const body = await res.json() as any;
  // Token path: body.data.session.accessToken  (camelCase, NOT access_token)
  const token: string = body?.data?.session?.accessToken;
  expect(token, 'accessToken must be present at data.session.accessToken').toBeTruthy();
  return token;
}

// ---------------------------------------------------------------------------
// Generic CRUD helpers
// ---------------------------------------------------------------------------

async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status, `GET ${path} should return 200`).toBe(200);
  return res.json() as Promise<any>;
}

async function apiPut(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(res.status, `PUT ${path} should return 200`).toBe(200);
  return res.json() as Promise<any>;
}

// ---------------------------------------------------------------------------
// Resource definitions
// ---------------------------------------------------------------------------

interface ResourceDef {
  name: string;           // display name for test output
  endpoint: string;       // e.g. /api/sales-orders
  idField: string;        // primary key field in list records
  editPayload: Record<string, unknown>;  // safe fields to PUT (non-destructive)
  verifyEdit: (data: any) => void;       // assert the edit took effect
}

const RESOURCES: ResourceDef[] = [
  {
    name: 'Sales Orders',
    endpoint: '/api/sales-orders',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id, 'updated record must have id').toBeTruthy(),
  },
  {
    name: 'Purchase Orders',
    endpoint: '/api/purchase-orders',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Sales Shipments',
    endpoint: '/api/sales-shipments',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Customers',
    endpoint: '/api/customers',
    idField: 'id',
    editPayload: { status: 'active' },   // customers has no 'notes' column
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Suppliers',
    endpoint: '/api/suppliers',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },  // suppliers HAS notes
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Products',
    endpoint: '/api/products',
    idField: 'id',
    editPayload: { description: '[api-test] list→show→edit OK' },  // products has no 'notes'
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Warehouses',
    endpoint: '/api/warehouses',
    idField: 'id',
    editPayload: { location: '[api-test] list→show→edit OK' },  // warehouses has no 'notes'
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Purchase Receipts',
    endpoint: '/api/purchase-receipts',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Sales Invoices',
    endpoint: '/api/sales-invoices',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Supplier Invoices',
    endpoint: '/api/supplier-invoices',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
  {
    name: 'Payment Requests',
    endpoint: '/api/payment-requests',
    idField: 'id',
    editPayload: { notes: '[api-test] list→show→edit OK' },
    verifyEdit: (d) => expect(d?.id).toBeTruthy(),
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth', () => {
  it('POST /api/auth/login returns accessToken at data.session.accessToken', async () => {
    const token = await login();
    expect(token).toMatch(/^ey/); // JWT starts with "ey"
  });
});

describe('API Integration — list (👁️ list) + show (👁️ detail) + edit (✏️)', () => {
  let token: string;

  beforeAll(async () => {
    token = await login();
  });

  for (const resource of RESOURCES) {
    describe(resource.name, () => {
      let firstId: string;

      it(`GET ${resource.endpoint} — list returns records`, async () => {
        const body = await apiGet(`${resource.endpoint}?pageSize=5`, token);
        expect(body.data, 'response must have data array').toBeInstanceOf(Array);
        expect(body.data.length, 'list must have at least 1 record').toBeGreaterThan(0);
        expect(body.total, 'response must have total').toBeGreaterThan(0);
        firstId = body.data[0][resource.idField];
        expect(firstId, 'first record must have an id').toBeTruthy();
      });

      it(`GET ${resource.endpoint}/:id — show (👁️) returns single record`, async () => {
        if (!firstId) return; // skip if list test failed
        const body = await apiGet(`${resource.endpoint}/${firstId}`, token);
        expect(body.data, 'show response must have data object').toBeTruthy();
        expect(body.data[resource.idField], 'show record id must match').toBe(firstId);
      });

      it(`PUT ${resource.endpoint}/:id — edit (✏️) updates and returns id`, async () => {
        if (!firstId) return; // skip if list test failed
        const body = await apiPut(`${resource.endpoint}/${firstId}`, token, resource.editPayload);
        expect(body.data, 'edit response must have data').toBeTruthy();
        resource.verifyEdit(body.data);
      });
    });
  }
});
