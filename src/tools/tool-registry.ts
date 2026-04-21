// src/tools/tool-registry.ts
// Central tool registry — assembles ToolSet by domain and agent type

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ToolSet } from 'ai';
import { createInventoryTools } from './inventory-tools';
import { createProcurementTools } from './procurement-tools';
import { createSalesTools } from './sales-tools';
import { createFinanceTools } from './finance-tools';
import { createMasterDataTools } from './master-data-tools';
import { createReportingTools } from './reporting-tools';
import { createQualityTools } from './quality-tools';
import { createManufacturingTools } from './manufacturing-tools';
import { createContractsTools } from './contracts-tools';
import { createAssetsTools } from './assets-tools';
import { createPartnersTools } from './partners-tools';
import { createLookupTools } from './lookup-tools';
import { createSchemaTools } from './schema-tools';
import { createSystemTools } from './system-tools';
import { intentTools } from './intent-tools';

export type DomainScope = 'procurement' | 'sales' | 'inventory' | 'finance' | 'quality' | 'manufacturing' | 'contracts' | 'assets' | 'partners' | 'master-data' | 'reporting' | 'schema' | 'system' | 'all';

export interface ToolRegistryOptions {
  db: SupabaseClient;
  organizationId: string;
  domains?: DomainScope[];
}

/** Build a ToolSet for the Execution Agent based on requested domains */
export function buildToolSet(options: ToolRegistryOptions): ToolSet {
  const { db, organizationId, domains = ['all'] } = options;
  const includeAll = domains.includes('all');
  const tools: ToolSet = {};

  const include = (d: DomainScope) => includeAll || domains.includes(d);

  if (include('inventory')) Object.assign(tools, createInventoryTools(db, organizationId));
  if (include('procurement')) Object.assign(tools, createProcurementTools(db, organizationId));
  if (include('sales')) Object.assign(tools, createSalesTools(db, organizationId));
  if (include('finance')) Object.assign(tools, createFinanceTools(db, organizationId));
  if (include('master-data')) Object.assign(tools, createMasterDataTools(db, organizationId));
  if (include('reporting')) Object.assign(tools, createReportingTools(db, organizationId));
  if (include('quality')) Object.assign(tools, createQualityTools(db, organizationId));
  if (include('manufacturing')) Object.assign(tools, createManufacturingTools(db, organizationId));
  if (include('contracts')) Object.assign(tools, createContractsTools(db, organizationId));
  if (include('assets')) Object.assign(tools, createAssetsTools(db, organizationId));
  if (include('partners')) Object.assign(tools, createPartnersTools(db, organizationId));
  if (include('schema')) Object.assign(tools, createSchemaTools(db, organizationId));
  if (include('system')) Object.assign(tools, createSystemTools(db, organizationId));
  Object.assign(tools, createLookupTools(db, organizationId));

  return tools;
}

/** ToolSet for Intent Agent — no DB tools, only NLP helpers */
export function buildIntentToolSet(): ToolSet {
  return { ...intentTools };
}

/** Registry metadata for policy checks */
export const TOOL_REGISTRY_META = [
  // inventory
  { name: 'get_stock_levels', domain: 'inventory', level: 0, cacheable: true },
  { name: 'get_stock_transactions', domain: 'inventory', level: 0, cacheable: true },
  { name: 'list_warehouses', domain: 'inventory', level: 0, cacheable: true },
  { name: 'list_inventory_lots', domain: 'inventory', level: 0, cacheable: true },
  { name: 'list_serial_numbers', domain: 'inventory', level: 0, cacheable: false },
  { name: 'list_inventory_counts', domain: 'inventory', level: 0, cacheable: true },
  { name: 'get_low_stock_alerts', domain: 'inventory', level: 0, cacheable: true },
  { name: 'list_inventory_reservations', domain: 'inventory', level: 0, cacheable: true },
  { name: 'transfer_stock', domain: 'inventory', level: 2, cacheable: false },
  // procurement
  { name: 'list_purchase_orders', domain: 'procurement', level: 0, cacheable: true },
  { name: 'get_purchase_order', domain: 'procurement', level: 0, cacheable: false },
  { name: 'create_purchase_order', domain: 'procurement', level: 2, cacheable: false },
  { name: 'list_suppliers', domain: 'procurement', level: 0, cacheable: true },
  { name: 'list_purchase_requisitions', domain: 'procurement', level: 0, cacheable: true },
  { name: 'get_purchase_requisition', domain: 'procurement', level: 0, cacheable: false },
  { name: 'list_rfq_headers', domain: 'procurement', level: 0, cacheable: true },
  { name: 'list_supplier_quotations', domain: 'procurement', level: 0, cacheable: false },
  { name: 'list_purchase_receipts', domain: 'procurement', level: 0, cacheable: true },
  { name: 'list_supplier_invoices', domain: 'procurement', level: 0, cacheable: true },
  // procurement — ASN & reconciliation
  { name: 'list_advance_shipment_notices', domain: 'procurement', level: 0, cacheable: true },
  { name: 'list_reconciliation_statements', domain: 'procurement', level: 0, cacheable: true },
  { name: 'create_purchase_requisition', domain: 'procurement', level: 2, cacheable: false },
  { name: 'submit_purchase_order', domain: 'procurement', level: 2, cacheable: false },
  { name: 'approve_purchase_order', domain: 'procurement', level: 3, cacheable: false },
  { name: 'submit_purchase_requisition', domain: 'procurement', level: 2, cacheable: false },
  { name: 'approve_purchase_requisition', domain: 'procurement', level: 3, cacheable: false },
  // sales
  { name: 'list_sales_orders', domain: 'sales', level: 0, cacheable: true },
  { name: 'get_sales_order', domain: 'sales', level: 0, cacheable: false },
  { name: 'create_sales_order', domain: 'sales', level: 2, cacheable: false },
  { name: 'list_customers', domain: 'sales', level: 0, cacheable: true },
  { name: 'list_sales_invoices', domain: 'sales', level: 0, cacheable: true },
  { name: 'list_sales_returns', domain: 'sales', level: 0, cacheable: true },
  { name: 'list_customer_receipts', domain: 'sales', level: 0, cacheable: true },
  { name: 'list_sales_shipments', domain: 'sales', level: 0, cacheable: true },
  { name: 'list_vouchers', domain: 'finance', level: 0, cacheable: true },
  { name: 'get_budget_vs_actual', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_payment_requests', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_account_subjects', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_cost_centers', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_budgets', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_payment_records', domain: 'finance', level: 0, cacheable: true },
  { name: 'list_approval_records', domain: 'finance', level: 0, cacheable: false },
  { name: 'create_voucher', domain: 'finance', level: 3, cacheable: false },
  { name: 'void_voucher', domain: 'finance', level: 3, cacheable: false },
  { name: 'submit_payment_request', domain: 'finance', level: 2, cacheable: false },
  { name: 'approve_payment_request', domain: 'finance', level: 3, cacheable: false },
  // master-data
  { name: 'list_products', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_currencies', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_departments', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_employees', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_exchange_rates', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_carriers', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_price_lists', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_uoms', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_number_sequences', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_organizations', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_tax_codes', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_storage_locations', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_product_categories', domain: 'master-data', level: 0, cacheable: true },
  { name: 'get_product', domain: 'master-data', level: 0, cacheable: false },
  { name: 'list_customers', domain: 'master-data', level: 0, cacheable: true },
  { name: 'list_suppliers', domain: 'master-data', level: 0, cacheable: true },
  // reporting
  { name: 'get_procurement_summary', domain: 'reporting', level: 0, cacheable: true },
  { name: 'get_sales_summary', domain: 'reporting', level: 0, cacheable: true },
  { name: 'get_inventory_valuation', domain: 'reporting', level: 0, cacheable: true },
  { name: 'get_finance_summary', domain: 'reporting', level: 0, cacheable: true },
  { name: 'get_manufacturing_summary', domain: 'reporting', level: 0, cacheable: true },
  // quality
  { name: 'list_quality_inspections', domain: 'quality', level: 0, cacheable: true },
  { name: 'get_quality_inspection', domain: 'quality', level: 0, cacheable: false },
  { name: 'list_quality_standards', domain: 'quality', level: 0, cacheable: true },
  { name: 'list_defect_codes', domain: 'quality', level: 0, cacheable: true },
  { name: 'create_quality_inspection', domain: 'quality', level: 2, cacheable: false },
  // manufacturing
  { name: 'list_work_orders', domain: 'manufacturing', level: 0, cacheable: true },
  { name: 'get_work_order', domain: 'manufacturing', level: 0, cacheable: false },
  { name: 'list_bom_headers', domain: 'manufacturing', level: 0, cacheable: true },
  { name: 'get_bom', domain: 'manufacturing', level: 0, cacheable: false },
  { name: 'list_work_order_materials', domain: 'manufacturing', level: 0, cacheable: false },
  { name: 'list_work_order_productions', domain: 'manufacturing', level: 0, cacheable: false },
  { name: 'create_work_order', domain: 'manufacturing', level: 2, cacheable: false },
  // contracts
  { name: 'list_contracts', domain: 'contracts', level: 0, cacheable: true },
  { name: 'get_contract', domain: 'contracts', level: 0, cacheable: false },
  { name: 'list_contract_items', domain: 'contracts', level: 0, cacheable: false },
  { name: 'activate_contract', domain: 'contracts', level: 2, cacheable: false },
  { name: 'terminate_contract', domain: 'contracts', level: 3, cacheable: false },
  // assets
  { name: 'list_fixed_assets', domain: 'assets', level: 0, cacheable: true },
  { name: 'get_fixed_asset', domain: 'assets', level: 0, cacheable: false },
  { name: 'list_asset_depreciations', domain: 'assets', level: 0, cacheable: false },
  { name: 'list_asset_maintenance', domain: 'assets', level: 0, cacheable: false },
  // partners
  { name: 'get_supplier', domain: 'partners', level: 0, cacheable: false },
  { name: 'get_customer', domain: 'partners', level: 0, cacheable: false },
  { name: 'list_supplier_contacts', domain: 'partners', level: 0, cacheable: false },
  { name: 'list_supplier_certificates', domain: 'partners', level: 0, cacheable: false },
  // lookup & schema
  { name: 'lookup_by_number', domain: 'lookup', level: 0, cacheable: false },
  { name: 'list_active_schemas', domain: 'schema', level: 0, cacheable: true },
  { name: 'get_schema', domain: 'schema', level: 0, cacheable: false },
  { name: 'preview_component_snapshot', domain: 'schema', level: 1, cacheable: false },
  // system
  { name: 'list_workflows', domain: 'system', level: 0, cacheable: false },
  { name: 'list_document_relations', domain: 'system', level: 0, cacheable: false },
];
