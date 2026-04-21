// src/routes/partners.ts
// Partners REST API — Customers & Suppliers with nested addresses, bank accounts, sites

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, buildNestedCrudRoutes, type CrudConfig } from '../utils/crud-factory';

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
    'id, name, code, customer_type, classification, contact, email, phone, status, credit_limit, payment_terms',
  detailSelect:
    '*, addresses:customer_addresses(id, address_type, contact_name, contact_phone, address, city, province, postal_code, country, is_default), bank_accounts:customer_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    customer_type: z.string().optional(),
    tax_number: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
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
  softDelete: true,
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
    'id, name, code, supplier_type, contact_person, contact_email, contact_phone, status, currency, payment_terms, lead_time_days, reliability_score',
  detailSelect:
    '*, sites:supplier_sites(id, site_code, site_name, address, city, province, postal_code, country, contact_name, contact_phone, is_active), bank_accounts:supplier_bank_accounts(id, bank_name, account_number, account_name, swift_code, currency, is_default)',
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
  childListSelect: 'id, name, title, email, phone, is_primary',
  childReturnSelect: 'id, name, email',
  defaultSort: 'is_primary',
  softDelete: true,
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
}));

// ---------------------------------------------------------------------------
// Profile Change Requests — supplier self-service change tracking
// ---------------------------------------------------------------------------
const profileChangeRequestsConfig: CrudConfig = {
  table: 'profile_change_requests',
  path: '/profile-change-requests',
  resourceName: 'ProfileChangeRequest',
  listSelect: 'id, supplier_id, request_type, change_request_id, status, created_by, created_at, updated_at',
  detailSelect: '*',
  createReturnSelect: 'id, request_type, status',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: false,
  parentOwnership: { parentFk: 'supplier_id', parentTable: 'suppliers' },
};

partners.route('', buildCrudRoutes(profileChangeRequestsConfig));

export default partners;
