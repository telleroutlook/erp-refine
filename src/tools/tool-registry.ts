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
import { createLookupTools } from './lookup-tools';
import { createSchemaTools } from './schema-tools';
import { intentTools } from './intent-tools';

export type DomainScope = 'procurement' | 'sales' | 'inventory' | 'finance' | 'quality' | 'manufacturing' | 'master-data' | 'reporting' | 'schema' | 'all';

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
  if (include('schema')) Object.assign(tools, createSchemaTools(db, organizationId));
  Object.assign(tools, createLookupTools(db, organizationId));

  return tools;
}

/** ToolSet for Intent Agent — no DB tools, only NLP helpers */
export function buildIntentToolSet(): ToolSet {
  return { ...intentTools };
}

/** Registry metadata for policy checks */
export const TOOL_REGISTRY_META = [
  { name: 'get_stock_levels', domain: 'inventory', level: 0 },
  { name: 'get_stock_transactions', domain: 'inventory', level: 0 },
  { name: 'list_warehouses', domain: 'inventory', level: 0 },
  { name: 'list_purchase_orders', domain: 'procurement', level: 0 },
  { name: 'get_purchase_order', domain: 'procurement', level: 0 },
  { name: 'create_purchase_order', domain: 'procurement', level: 2 },
  { name: 'list_suppliers', domain: 'procurement', level: 0 },
  { name: 'list_sales_orders', domain: 'sales', level: 0 },
  { name: 'get_sales_order', domain: 'sales', level: 0 },
  { name: 'create_sales_order', domain: 'sales', level: 2 },
  { name: 'list_customers', domain: 'sales', level: 0 },
  { name: 'list_vouchers', domain: 'finance', level: 0 },
  { name: 'get_budget_vs_actual', domain: 'finance', level: 0 },
  { name: 'list_payment_requests', domain: 'finance', level: 0 },
  { name: 'list_products', domain: 'master-data', level: 0 },
  { name: 'list_currencies', domain: 'master-data', level: 0 },
  { name: 'list_departments', domain: 'master-data', level: 0 },
  { name: 'list_employees', domain: 'master-data', level: 0 },
  { name: 'get_procurement_summary', domain: 'reporting', level: 0 },
  { name: 'get_sales_summary', domain: 'reporting', level: 0 },
  { name: 'get_inventory_valuation', domain: 'reporting', level: 0 },
  { name: 'list_quality_inspections', domain: 'quality', level: 0 },
  { name: 'list_work_orders', domain: 'manufacturing', level: 0 },
  { name: 'lookup_by_number', domain: 'lookup', level: 0 },
  { name: 'list_active_schemas', domain: 'schema', level: 0 },
  { name: 'get_schema', domain: 'schema', level: 0 },
  { name: 'preview_component_snapshot', domain: 'schema', level: 1 },
];
