// src/routes/partners.ts
// Partners REST API — Customers & Suppliers with nested addresses, bank accounts, sites

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';

const partners = new Hono<{ Bindings: Env }>();
partners.use('*', authMiddleware());

// ---------------------------------------------------------------------------
// Customers — main CRUD via factory
// ---------------------------------------------------------------------------
const customersConfig: CrudConfig = {
  table: 'customers',
  path: '/customers',
  resourceName: 'Customer',
  listSelect:
    'id, name, code, customer_type, classification, email, phone, status, credit_limit, payment_terms',
  detailSelect:
    '*, addresses:customer_addresses(id, address_type, contact_name, contact_phone, address, city, province, postal_code, country, is_default), bank_accounts:customer_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    short_name: z.string().optional().nullable(),
    type: z.string().optional(),
    customer_type: z.string().optional(),
    tax_number: z.string().optional().nullable(),
    tax_no: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    credit_limit: z.number().optional().nullable(),
    payment_terms: z.number().optional().nullable(),
    classification: z.string().optional().nullable(),
    status: z.string().optional(),
  }).strip(),
};

const customersRouter = buildCrudRoutes(customersConfig);
partners.route('', customersRouter);

// ---------------------------------------------------------------------------
// Customer Addresses — nested CRUD under /customers/:customerId/addresses
// ---------------------------------------------------------------------------

// GET list
partners.get('/customers/:customerId/addresses', async (c) => {
  const { db, user } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'is_default');

  // Verify customer belongs to org
  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, c.get('requestId'));
  }

  const { data, count, error } = await db
    .from('customer_addresses')
    .select(
      'id, address_type, contact_name, contact_phone, address, city, province, postal_code, country, is_default',
      { count: 'exact' }
    )
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    throw ApiError.database(error.message, c.get('requestId'));
  }
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
partners.get('/customers/:customerId/addresses/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const { data, error } = await db
    .from('customer_addresses')
    .select('*')
    .eq('id', id)
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw ApiError.notFound('CustomerAddress', id, requestId);
  return c.json({ data });
});

// POST create
partners.post('/customers/:customerId/addresses', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('customer_addresses')
    .insert({ ...body, customer_id: customerId })
    .select('id, address_type, contact_name')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// PUT update
partners.put('/customers/:customerId/addresses/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('customer_addresses')
    .update(body)
    .eq('id', id)
    .eq('customer_id', customerId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('CustomerAddress', id, requestId);
  return c.json({ data });
});

// DELETE soft-delete
partners.delete('/customers/:customerId/addresses/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const { error } = await db
    .from('customer_addresses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('customer_id', customerId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ---------------------------------------------------------------------------
// Customer Bank Accounts — nested CRUD under /customers/:customerId/bank-accounts
// ---------------------------------------------------------------------------

// GET list
partners.get('/customers/:customerId/bank-accounts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'bank_name');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, c.get('requestId'));
  }

  const { data, count, error } = await db
    .from('customer_bank_accounts')
    .select(
      'id, bank_name, account_number, account_name, swift_code, currency, is_default',
      { count: 'exact' }
    )
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
partners.get('/customers/:customerId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const { data, error } = await db
    .from('customer_bank_accounts')
    .select('*')
    .eq('id', id)
    .eq('customer_id', customerId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw ApiError.notFound('CustomerBankAccount', id, requestId);
  return c.json({ data });
});

// POST create
partners.post('/customers/:customerId/bank-accounts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('customer_bank_accounts')
    .insert({ ...body, customer_id: customerId, organization_id: user.organizationId })
    .select('id, bank_name, account_number')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// PUT update
partners.put('/customers/:customerId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('customer_bank_accounts')
    .update(body)
    .eq('id', id)
    .eq('customer_id', customerId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('CustomerBankAccount', id, requestId);
  return c.json({ data });
});

// DELETE soft-delete
partners.delete('/customers/:customerId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const customerId = c.req.param('customerId');
  const id = c.req.param('id');

  const { data: customer, error: custErr } = await db
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (custErr || !customer) {
    throw ApiError.notFound('Customer', customerId, requestId);
  }

  const { error } = await db
    .from('customer_bank_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('customer_id', customerId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// Also update customer detailSelect to include bank_accounts
// (already done in customersConfig.detailSelect via manual select below)

// ---------------------------------------------------------------------------
// Suppliers — main CRUD via factory
// ---------------------------------------------------------------------------
const suppliersConfig: CrudConfig = {
  table: 'suppliers',
  path: '/suppliers',
  resourceName: 'Supplier',
  listSelect:
    'id, name, code, supplier_type, contact_email, contact_phone, status, currency, payment_terms, lead_time_days, reliability_score',
  detailSelect:
    '*, sites:supplier_sites(id, site_code, site_name, address, city, province, postal_code, country, contact_name, contact_phone, is_active), bank_accounts:supplier_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    short_name: z.string().optional().nullable(),
    supplier_type: z.string().optional(),
    status: z.string().optional(),
    tax_number: z.string().optional().nullable(),
    tax_no: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    currency: z.string().optional().nullable(),
    payment_terms: z.number().optional().nullable(),
    contact_person: z.string().optional().nullable(),
    contact_phone: z.string().optional().nullable(),
    contact_email: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    lead_time_days: z.number().optional().nullable(),
    reliability_score: z.number().optional().nullable(),
  }).strip(),
};

const suppliersRouter = buildCrudRoutes(suppliersConfig);
partners.route('', suppliersRouter);

// ---------------------------------------------------------------------------
// Supplier Sites — nested CRUD under /suppliers/:supplierId/sites
// ---------------------------------------------------------------------------

// GET list
partners.get('/suppliers/:supplierId/sites', async (c) => {
  const { db, user } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'site_name');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, c.get('requestId'));
  }

  const { data, count, error } = await db
    .from('supplier_sites')
    .select(
      'id, site_code, site_name, address, city, province, postal_code, country, contact_name, contact_phone, is_active',
      { count: 'exact' }
    )
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
partners.get('/suppliers/:supplierId/sites/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const { data, error } = await db
    .from('supplier_sites')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw ApiError.notFound('SupplierSite', id, requestId);
  return c.json({ data });
});

// POST create
partners.post('/suppliers/:supplierId/sites', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('supplier_sites')
    .insert({ ...body, supplier_id: supplierId })
    .select('id, site_name')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// PUT update
partners.put('/suppliers/:supplierId/sites/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('supplier_sites')
    .update(body)
    .eq('id', id)
    .eq('supplier_id', supplierId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierSite', id, requestId);
  return c.json({ data });
});

// DELETE soft-delete
partners.delete('/suppliers/:supplierId/sites/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const { error } = await db
    .from('supplier_sites')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('supplier_id', supplierId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ---------------------------------------------------------------------------
// Supplier Bank Accounts — nested CRUD under /suppliers/:supplierId/bank-accounts
// ---------------------------------------------------------------------------

// GET list
partners.get('/suppliers/:supplierId/bank-accounts', async (c) => {
  const { db, user } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'bank_name');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, c.get('requestId'));
  }

  const { data, count, error } = await db
    .from('supplier_bank_accounts')
    .select(
      'id, bank_name, account_number, account_name, swift_code, currency, is_default',
      { count: 'exact' }
    )
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'));
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

// GET detail
partners.get('/suppliers/:supplierId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const { data, error } = await db
    .from('supplier_bank_accounts')
    .select('*')
    .eq('id', id)
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw ApiError.notFound('SupplierBankAccount', id, requestId);
  return c.json({ data });
});

// POST create
partners.post('/suppliers/:supplierId/bank-accounts', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('supplier_bank_accounts')
    .insert({ ...body, supplier_id: supplierId })
    .select('id, bank_name, account_number')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

// PUT update
partners.put('/suppliers/:supplierId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const body = await c.req.json();
  const { data, error } = await db
    .from('supplier_bank_accounts')
    .update(body)
    .eq('id', id)
    .eq('supplier_id', supplierId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('SupplierBankAccount', id, requestId);
  return c.json({ data });
});

// DELETE soft-delete
partners.delete('/suppliers/:supplierId/bank-accounts/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const supplierId = c.req.param('supplierId');
  const id = c.req.param('id');

  const { data: supplier, error: supErr } = await db
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();
  if (supErr || !supplier) {
    throw ApiError.notFound('Supplier', supplierId, requestId);
  }

  const { error } = await db
    .from('supplier_bank_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('supplier_id', supplierId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

export default partners;
