// src/routes/partners.ts
// Partners REST API — Customers & Suppliers with nested addresses, bank accounts, sites

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, buildNestedCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';
import { profile_change_requests } from '../schema/columns';

const partners = new Hono<{ Bindings: Env }>();
partners.use('*', authMiddleware());
partners.use('*', writeMethodGuard());

// ---------------------------------------------------------------------------
// Customers — main CRUD via factory
// ---------------------------------------------------------------------------
const customersConfig: CrudConfig = {
  table: 'customers',
  path: '/customers',
  resourceName: 'Customer',
  listSelect:
    'id, name, code, type, classification, contact, email, phone, status, credit_limit, payment_terms, default_price_list_id',
  detailSelect:
    '*, addresses:customer_addresses!customer_addresses_customer_id_fkey(id, address_type, contact_name, contact_phone, address, city, province, postal_code, country, is_default), bank_accounts:customer_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    type: z.string().optional(),
    tax_number: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    credit_limit: z.number().optional().nullable(),
    payment_terms: z.number().optional().nullable(),
    classification: z.string().optional().nullable(),
    status: z.string().optional(),
    default_price_list_id: z.string().uuid().optional().nullable(),
  }).strip(),
};

partners.route('', buildCrudRoutes(customersConfig));

// ---------------------------------------------------------------------------
// Customer Addresses — nested CRUD under /customers/:customerId/addresses
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'customers',
  parentParam: 'customerId',
  parentFk: 'customer_id',
  childTable: 'customer_addresses',
  childPath: 'addresses',
  childResourceName: 'CustomerAddress',
  childListSelect: 'id, address_type, contact_name, contact_phone, address, city, province, postal_code, country, is_default',
  childReturnSelect: 'id, address_type, contact_name',
  defaultSort: 'is_default',
  softDelete: false,
}));

// ---------------------------------------------------------------------------
// Customer Bank Accounts — nested CRUD under /customers/:customerId/bank-accounts
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'customers',
  parentParam: 'customerId',
  parentFk: 'customer_id',
  childTable: 'customer_bank_accounts',
  childPath: 'bank-accounts',
  childResourceName: 'CustomerBankAccount',
  childListSelect: 'id, bank_name, account_number, account_name, swift_code, currency, is_default',
  childReturnSelect: 'id, bank_name, account_number',
  defaultSort: 'bank_name',
  softDelete: true,
  createExtras: (user) => ({ organization_id: user.organizationId }),
}));

// ---------------------------------------------------------------------------
// Suppliers — main CRUD via factory
// ---------------------------------------------------------------------------
const suppliersConfig: CrudConfig = {
  table: 'suppliers',
  path: '/suppliers',
  resourceName: 'Supplier',
  listSelect:
    'id, name, code, supplier_type, contact_person, contact_email, contact_phone, status, currency, payment_terms, lead_time_days, reliability_score, default_price_list_id',
  detailSelect:
    '*, sites:supplier_sites!supplier_sites_supplier_id_fkey(id, site_code, site_name, address, city, province, postal_code, country, contact_name, contact_phone, is_active), bank_accounts:supplier_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    supplier_type: z.string().optional(),
    status: z.string().optional(),
    tax_number: z.string().optional().nullable(),
    currency: z.string().optional().nullable(),
    payment_terms: z.number().optional().nullable(),
    contact_person: z.string().optional().nullable(),
    contact_phone: z.string().optional().nullable(),
    contact_email: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    default_site_id: z.string().uuid().optional().nullable(),
    notes: z.string().optional().nullable(),
    lead_time_days: z.number().optional().nullable(),
    reliability_score: z.number().optional().nullable(),
    default_price_list_id: z.string().uuid().optional().nullable(),
  }).strip(),
};

partners.route('', buildCrudRoutes(suppliersConfig));

// ---------------------------------------------------------------------------
// Supplier Sites — nested CRUD under /suppliers/:supplierId/sites
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'suppliers',
  parentParam: 'supplierId',
  parentFk: 'supplier_id',
  childTable: 'supplier_sites',
  childPath: 'sites',
  childResourceName: 'SupplierSite',
  childListSelect: 'id, site_code, site_name, address, city, province, postal_code, country, contact_name, contact_phone, is_active',
  childReturnSelect: 'id, site_name',
  defaultSort: 'site_name',
  softDelete: true,
  createExtras: (user) => ({ organization_id: user.organizationId }),
}));

// ---------------------------------------------------------------------------
// Supplier Bank Accounts — nested CRUD under /suppliers/:supplierId/bank-accounts
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'suppliers',
  parentParam: 'supplierId',
  parentFk: 'supplier_id',
  childTable: 'supplier_bank_accounts',
  childPath: 'bank-accounts',
  childResourceName: 'SupplierBankAccount',
  childListSelect: 'id, bank_name, account_number, account_name, swift_code, currency, is_default',
  childReturnSelect: 'id, bank_name, account_number',
  defaultSort: 'bank_name',
  softDelete: true,
  createExtras: (user) => ({ organization_id: user.organizationId }),
}));

// ---------------------------------------------------------------------------
// Supplier Contacts — nested CRUD under /suppliers/:supplierId/contacts
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'suppliers',
  parentParam: 'supplierId',
  parentFk: 'supplier_id',
  childTable: 'supplier_contacts',
  childPath: 'contacts',
  childResourceName: 'SupplierContact',
  childListSelect: 'id, name, title, email, phone, is_default',
  childReturnSelect: 'id, name, email',
  defaultSort: 'is_default',
  softDelete: true,
  createExtras: (user) => ({ organization_id: user.organizationId }),
}));

// ---------------------------------------------------------------------------
// Supplier Certificates — nested CRUD under /suppliers/:supplierId/certificates
// ---------------------------------------------------------------------------
partners.route('', buildNestedCrudRoutes({
  parentTable: 'suppliers',
  parentParam: 'supplierId',
  parentFk: 'supplier_id',
  childTable: 'supplier_certificates',
  childPath: 'certificates',
  childResourceName: 'SupplierCertificate',
  childListSelect: 'id, certificate_type, certificate_number, issued_by, issued_date, expiry_date, status',
  childReturnSelect: 'id, certificate_type, certificate_number',
  defaultSort: 'expiry_date',
  softDelete: true,
  createExtras: (user) => ({ organization_id: user.organizationId }),
}));

// ---------------------------------------------------------------------------
// Profile Change Requests — supplier self-service change tracking
// ---------------------------------------------------------------------------
const profileChangeRequestsConfig: CrudConfig = {
  table: 'profile_change_requests',
  path: '/profile-change-requests',
  resourceName: 'ProfileChangeRequest',
  listSelect: 'id, supplier_id, request_type, change_request_id, status, created_by, created_at, updated_at',
  detailSelect: profile_change_requests.join(', '),
  createReturnSelect: 'id, request_type, status, change_request_id',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
  disableCreate: true,
};

partners.route('', buildCrudRoutes(profileChangeRequestsConfig));

// Custom POST: auto-generate change_request_id via sequence
partners.post('/profile-change-requests', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data: num, error: seqError } = await db.rpc('get_next_sequence', {
    p_organization_id: user.organizationId,
    p_sequence_name: 'profile_change_request',
  });
  if (seqError || !num) throw ApiError.database(
    `Sequence generation failed: ${seqError?.message ?? 'Sequence unavailable'}`, requestId
  );

  // Only pass known columns (notes not in schema, change_request_id is auto-generated)
  const allowedFields = new Set(['supplier_id', 'request_type', 'status', 'before_data', 'after_data']);
  const rest = Object.fromEntries(Object.entries(body).filter(([k]) => allowedFields.has(k)));

  const { data, error } = await db
    .from('profile_change_requests')
    .insert({
      ...rest,
      change_request_id: num,
      organization_id: user.organizationId,
      created_by: user.userId,
    })
    .select('id, request_type, status, change_request_id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

export default partners;
