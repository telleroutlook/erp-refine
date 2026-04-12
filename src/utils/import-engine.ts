// src/utils/import-engine.ts
// Data import engine — dependency-aware batch processing with validation and error aggregation

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';

const logger = createLogger('info', { module: 'import-engine' });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportOptions {
  /** Update existing records by unique key (default false) */
  upsert?: boolean;
  /** Only validate, don't insert (default false) */
  dryRun?: boolean;
  /** How to handle row errors: 'skip' continues, 'abort' stops (default 'skip') */
  onError?: 'skip' | 'abort';
}

export interface ImportRowError {
  row: number;
  field?: string;
  message: string;
  hint?: string;
}

export interface ImportResult {
  entity: string;
  imported: number;
  skipped: number;
  errors: ImportRowError[];
  dryRun: boolean;
}

export interface EntityImportConfig {
  /** DB table name */
  table: string;
  /** Columns to return after insert */
  returnSelect: string;
  /** Required fields that must be present */
  requiredFields: string[];
  /** Unique key columns for upsert detection (e.g. ['code', 'organization_id']) */
  uniqueKey?: string[];
  /** Whether to auto-inject organization_id (default true) */
  orgScoped?: boolean;
  /** Whether this table has a sequence number field to auto-generate */
  sequenceField?: string;
  /** The sequence name for get_next_sequence RPC */
  sequenceName?: string;
  /** Foreign key references to validate { fieldName: tableName } */
  references?: Record<string, string>;
  /** Fields that should be excluded from import (auto-generated) */
  excludeFields?: string[];
  /** Transform function applied to each record before insert */
  transform?: (record: Record<string, unknown>, ctx: ImportContext) => Record<string, unknown>;
}

export interface ImportContext {
  organizationId: string;
  userId: string;
  db: SupabaseClient;
}

// ---------------------------------------------------------------------------
// Entity registry — defines how each entity is imported
// ---------------------------------------------------------------------------

export const ENTITY_CONFIGS: Record<string, EntityImportConfig> = {
  // --- Foundation ---
  currencies: {
    table: 'currencies',
    returnSelect: 'currency_code',
    requiredFields: ['currency_code', 'currency_name', 'symbol'],
    uniqueKey: ['currency_code'],
    orgScoped: false,
  },
  uoms: {
    table: 'uoms',
    returnSelect: 'id, uom_code',
    requiredFields: ['uom_code', 'uom_name', 'category'],
    uniqueKey: ['uom_code'],
    orgScoped: false,
  },

  // --- Organization structure ---
  departments: {
    table: 'departments',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name'],
    uniqueKey: ['code', 'organization_id'],
    references: { parent_id: 'departments' },
  },
  employees: {
    table: 'employees',
    returnSelect: 'id, employee_number, name',
    requiredFields: ['name', 'email', 'position', 'employee_number'],
    uniqueKey: ['email', 'organization_id'],
    references: { department_id: 'departments' },
  },

  // --- Master data ---
  'product-categories': {
    table: 'product_categories',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name'],
    uniqueKey: ['code', 'organization_id'],
    references: { parent_id: 'product_categories' },
  },
  products: {
    table: 'products',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name'],
    uniqueKey: ['code', 'organization_id'],
    references: { category_id: 'product_categories' },
    excludeFields: ['list_price', 'is_active', 'safety_stock'],
  },
  customers: {
    table: 'customers',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name'],
    uniqueKey: ['code', 'organization_id'],
  },
  'customer-addresses': {
    table: 'customer_addresses',
    returnSelect: 'id',
    requiredFields: ['customer_id', 'address_type'],
    references: { customer_id: 'customers' },
  },
  suppliers: {
    table: 'suppliers',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name', 'supplier_type'],
    uniqueKey: ['code', 'organization_id'],
  },
  'supplier-sites': {
    table: 'supplier_sites',
    returnSelect: 'id',
    requiredFields: ['supplier_id', 'site_code', 'site_name'],
    references: { supplier_id: 'suppliers' },
  },
  warehouses: {
    table: 'warehouses',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name', 'type'],
    uniqueKey: ['code', 'organization_id'],
  },
  'storage-locations': {
    table: 'storage_locations',
    returnSelect: 'id, code',
    requiredFields: ['warehouse_id', 'code'],
    uniqueKey: ['warehouse_id', 'code'],
    orgScoped: false,
    references: { warehouse_id: 'warehouses' },
  },
  'price-lists': {
    table: 'price_lists',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name', 'price_type', 'currency'],
    uniqueKey: ['code', 'organization_id'],
  },

  // --- Finance setup ---
  'account-subjects': {
    table: 'account_subjects',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name', 'category', 'balance_direction'],
    uniqueKey: ['code', 'organization_id'],
    references: { parent_id: 'account_subjects' },
  },
  'cost-centers': {
    table: 'cost_centers',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name'],
    uniqueKey: ['code', 'organization_id'],
    references: { parent_id: 'cost_centers', department_id: 'departments' },
  },

  // --- Quality setup ---
  'defect-codes': {
    table: 'defect_codes',
    returnSelect: 'id, code, name',
    requiredFields: ['code', 'name', 'category', 'severity'],
    uniqueKey: ['code', 'organization_id'],
  },

  // --- Inventory ---
  'stock-records': {
    table: 'stock_records',
    returnSelect: 'id',
    requiredFields: ['warehouse_id', 'product_id', 'quantity'],
    uniqueKey: ['organization_id', 'warehouse_id', 'product_id'],
    references: { warehouse_id: 'warehouses', product_id: 'products' },
    excludeFields: ['qty_on_hand', 'qty_reserved', 'qty_available', 'available_quantity'],
  },

  // --- Exchange rates ---
  'exchange-rates': {
    table: 'exchange_rates',
    returnSelect: 'id, from_currency, to_currency, rate, effective_date',
    requiredFields: ['from_currency', 'to_currency', 'rate_type', 'rate', 'effective_date'],
    uniqueKey: ['organization_id', 'from_currency', 'to_currency', 'effective_date'],
    orgScoped: true,
  },

  // --- Fixed assets ---
  'fixed-assets': {
    table: 'fixed_assets',
    returnSelect: 'id, asset_number, asset_name',
    requiredFields: ['asset_number', 'asset_name', 'category', 'acquisition_date', 'acquisition_cost', 'useful_life_months', 'depreciation_method', 'salvage_value'],
    uniqueKey: ['asset_number', 'organization_id'],
    references: { cost_center_id: 'cost_centers' },
  },

  // --- Business documents ---
  'purchase-orders': {
    table: 'purchase_orders',
    returnSelect: 'id, order_number',
    requiredFields: ['supplier_id', 'order_date'],
    sequenceField: 'order_number',
    sequenceName: 'purchase_order',
    references: { supplier_id: 'suppliers', warehouse_id: 'warehouses' },
  },
  'purchase-order-items': {
    table: 'purchase_order_items',
    returnSelect: 'id',
    requiredFields: ['purchase_order_id', 'product_id', 'quantity', 'unit_price'],
    orgScoped: false,
    references: { purchase_order_id: 'purchase_orders', product_id: 'products' },
  },
  'sales-orders': {
    table: 'sales_orders',
    returnSelect: 'id, order_number',
    requiredFields: ['customer_id', 'order_date'],
    sequenceField: 'order_number',
    sequenceName: 'sales_order',
    references: { customer_id: 'customers', warehouse_id: 'warehouses' },
  },
  'sales-order-items': {
    table: 'sales_order_items',
    returnSelect: 'id',
    requiredFields: ['sales_order_id', 'product_id', 'quantity', 'unit_price'],
    orgScoped: false,
    references: { sales_order_id: 'sales_orders', product_id: 'products' },
  },
  'sales-invoices': {
    table: 'sales_invoices',
    returnSelect: 'id, invoice_number',
    requiredFields: ['customer_id', 'invoice_date'],
    sequenceField: 'invoice_number',
    sequenceName: 'sales_invoice',
    references: { customer_id: 'customers', sales_order_id: 'sales_orders' },
  },
  vouchers: {
    table: 'vouchers',
    returnSelect: 'id, voucher_number',
    requiredFields: ['voucher_date', 'voucher_type'],
    sequenceField: 'voucher_number',
    sequenceName: 'voucher',
  },
  'voucher-entries': {
    table: 'voucher_entries',
    returnSelect: 'id',
    requiredFields: ['voucher_id', 'account_subject_id', 'entry_type', 'amount'],
    orgScoped: false,
    references: { voucher_id: 'vouchers', account_subject_id: 'account_subjects' },
  },
};

// ---------------------------------------------------------------------------
// Dependency graph — determines import order
// ---------------------------------------------------------------------------

/** Entity dependencies: each entity lists what must be imported before it */
const ENTITY_DEPS: Record<string, string[]> = {
  currencies: [],
  uoms: [],
  departments: [],
  employees: ['departments'],
  'product-categories': [],
  products: ['product-categories'],
  customers: [],
  'customer-addresses': ['customers'],
  suppliers: [],
  'supplier-sites': ['suppliers'],
  warehouses: [],
  'storage-locations': ['warehouses'],
  'price-lists': [],
  'account-subjects': [],
  'cost-centers': ['departments'],
  'defect-codes': [],
  'stock-records': ['products', 'warehouses'],
  'exchange-rates': [],
  'fixed-assets': ['cost-centers'],
  'purchase-orders': ['suppliers', 'warehouses', 'products'],
  'purchase-order-items': ['purchase-orders', 'products'],
  'sales-orders': ['customers', 'warehouses', 'products'],
  'sales-order-items': ['sales-orders', 'products'],
  'sales-invoices': ['customers', 'sales-orders'],
  vouchers: [],
  'voucher-entries': ['vouchers', 'account-subjects'],
};

/** Topological sort — returns entities in dependency order */
export function getImportOrder(entities: string[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(entity: string) {
    if (visited.has(entity)) return;
    visited.add(entity);
    const deps = ENTITY_DEPS[entity] ?? [];
    for (const dep of deps) {
      if (entities.includes(dep)) visit(dep);
    }
    result.push(entity);
  }

  for (const entity of entities) visit(entity);
  return result;
}

/** Get all supported entity names */
export function getSupportedEntities(): string[] {
  return Object.keys(ENTITY_CONFIGS);
}

// ---------------------------------------------------------------------------
// Import execution
// ---------------------------------------------------------------------------

/** Import records for a single entity */
export async function importEntity(
  entity: string,
  records: Record<string, unknown>[],
  ctx: ImportContext,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return {
      entity,
      imported: 0,
      skipped: 0,
      errors: [{ row: 0, message: `Unknown entity '${entity}'.`, hint: `Supported entities: ${getSupportedEntities().join(', ')}` }],
      dryRun: options.dryRun ?? false,
    };
  }

  const { table, returnSelect, requiredFields, uniqueKey, orgScoped = true, sequenceField, sequenceName, excludeFields, transform } = config;
  const { dryRun = false, upsert = false, onError = 'skip' } = options;
  const errors: ImportRowError[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 1;
    let record = { ...records[i] };

    try {
      // --- Validate required fields ---
      for (const field of requiredFields) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          throw { field, message: `Required field '${field}' is missing.`, hint: `Provide a value for '${field}'.` };
        }
      }

      // --- Remove excluded fields ---
      if (excludeFields) {
        for (const f of excludeFields) delete record[f];
      }

      // --- Inject org scope ---
      if (orgScoped) {
        record.organization_id = ctx.organizationId;
      }

      // --- Generate sequence number if needed ---
      if (sequenceField && sequenceName && !record[sequenceField]) {
        const { data: seqData } = await ctx.db.rpc('get_next_sequence', {
          p_organization_id: ctx.organizationId,
          p_sequence_name: sequenceName,
        });
        record[sequenceField] = seqData ?? `${sequenceName.toUpperCase()}-${Date.now()}-${rowNum}`;
      }

      // --- Apply transform ---
      if (transform) {
        record = transform(record, ctx);
      }

      if (dryRun) {
        imported++;
        continue;
      }

      // --- Upsert check ---
      if (upsert && uniqueKey && uniqueKey.length > 0) {
        let query = ctx.db.from(table).select('id').limit(1);
        for (const key of uniqueKey) {
          const val = key === 'organization_id' ? ctx.organizationId : record[key];
          if (val !== undefined) query = query.eq(key, val as string);
        }
        const { data: existing } = await query.single();
        if (existing) {
          // Update existing
          const { id: _id, organization_id: _oid, ...updateData } = record as any;
          const { error } = await ctx.db
            .from(table)
            .update(updateData)
            .eq('id', (existing as any).id);
          if (error) throw { message: error.message, hint: 'Update failed during upsert.' };
          imported++;
          continue;
        }
      }

      // --- Insert ---
      const { error } = await ctx.db.from(table).insert(record).select(returnSelect);
      if (error) {
        throw { message: error.message, hint: hintFromPgError(error.message) };
      }
      imported++;
    } catch (err: any) {
      const rowError: ImportRowError = {
        row: rowNum,
        field: err.field,
        message: err.message ?? String(err),
        hint: err.hint,
      };
      errors.push(rowError);

      if (onError === 'abort') {
        return { entity, imported, skipped: records.length - imported - 1, errors, dryRun };
      }
      skipped++;
    }
  }

  logger.info(`import.${entity}`, { imported, skipped, errors: errors.length, dryRun });
  return { entity, imported, skipped, errors, dryRun };
}

/** Batch import multiple entities in dependency order */
export async function importBatch(
  data: Record<string, Record<string, unknown>[]>,
  ctx: ImportContext,
  options: ImportOptions = {}
): Promise<ImportResult[]> {
  const entities = Object.keys(data);
  const ordered = getImportOrder(entities);
  const results: ImportResult[] = [];

  for (const entity of ordered) {
    if (!data[entity] || data[entity].length === 0) continue;
    const result = await importEntity(entity, data[entity], ctx, options);
    results.push(result);

    // If abort mode and errors occurred, stop processing
    if (options.onError === 'abort' && result.errors.length > 0) {
      // Mark remaining entities as skipped
      for (const remaining of ordered.slice(ordered.indexOf(entity) + 1)) {
        if (data[remaining] && data[remaining].length > 0) {
          results.push({
            entity: remaining,
            imported: 0,
            skipped: data[remaining].length,
            errors: [{ row: 0, message: `Skipped due to errors in '${entity}'.`, hint: 'Fix errors in preceding entities and retry.' }],
            dryRun: options.dryRun ?? false,
          });
        }
      }
      break;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hintFromPgError(msg: string): string {
  if (msg.includes('violates foreign key')) {
    const match = msg.match(/Key \((\w+)\)=\(([^)]+)\) is not present/);
    if (match) return `Referenced ${match[1]} '${match[2]}' does not exist. Import it first.`;
    return 'A referenced record does not exist. Check import order.';
  }
  if (msg.includes('violates unique constraint')) {
    const match = msg.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (match) return `Record with ${match[1]}='${match[2]}' already exists. Use upsert:true to update.`;
    return 'Duplicate record. Use upsert:true to update existing records.';
  }
  if (msg.includes('violates not-null constraint')) {
    const match = msg.match(/column "(\w+)"/);
    if (match) return `Field '${match[1]}' is required.`;
  }
  if (msg.includes('violates check constraint')) {
    return 'A value failed validation. Check allowed values in the schema.';
  }
  return 'Check field values and referenced entity IDs.';
}
