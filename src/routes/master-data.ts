// src/routes/master-data.ts
// Master Data REST API — Products, Categories, Warehouses, Tax Codes, UoMs, etc.

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser, parseRefineQuery } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';

const masterData = new Hono<{ Bindings: Env }>();
masterData.use('*', authMiddleware());

// ────────────────────────────────────────────────────────────────────────────
// Products — custom CRUD (has enriched list select with category/uom joins)
// ────────────────────────────────────────────────────────────────────────────

masterData.get('/products', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, 'name');

  const { data, count, error } = await db
    .from('products')
    .select('id, name, code, description, type, uom, cost_price, list_price, category:product_categories(id,name)', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw ApiError.database(error.message, c.get('requestId'), `Failed to list Products. Check sort field '${sortField}' exists.`);
  return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
});

masterData.get('/products/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { data, error } = await db
    .from('products')
    .select('*, category:product_categories(id,name)')
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .is('deleted_at', null)
    .single();

  if (error) throw ApiError.notFound('Product', id, requestId);
  return c.json({ data });
});

masterData.post('/products', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const body = await c.req.json();

  const { data, error } = await db
    .from('products')
    .insert({ ...body, organization_id: user.organizationId })
    .select('id, name, code')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data }, 201);
});

masterData.put('/products/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');
  const raw = await c.req.json();

  // Only allow columns that exist on the products table
  const ALLOWED: Record<string, boolean> = {
    category_id: true, code: true, name: true, description: true, specification: true,
    unit: true, uom: true, type: true, item_type: true, brand: true, sku_code: true,
    is_lot_controlled: true, is_serial_controlled: true, is_active: true,
    safety_stock_days: true, safety_stock: true, average_daily_consumption: true,
    cost_price: true, standard_cost: true, sale_price: true, list_price: true,
    min_stock: true, max_stock: true, default_tax_code: true, status: true,
  };
  const body = Object.fromEntries(Object.entries(raw).filter(([k]) => ALLOWED[k]));

  const { data, error } = await db
    .from('products')
    .update(body)
    .eq('id', id)
    .eq('organization_id', user.organizationId)
    .select('id')
    .single();

  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound('Product', id, requestId);
  return c.json({ data });
});

masterData.delete('/products/:id', async (c) => {
  const { db, user, requestId } = getDbAndUser(c);
  const id = c.req.param('id');

  const { error } = await db
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', user.organizationId);

  if (error) throw ApiError.database(error.message, requestId);
  return c.json({ data: { success: true } });
});

// ────────────────────────────────────────────────────────────────────────────
// Product Categories — tree structure, full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const productCategoriesConfig: CrudConfig = {
  table: 'product_categories',
  path: '/product-categories',
  resourceName: 'ProductCategory',
  listSelect: 'id, code, name, parent_id, level, is_active',
  detailSelect: '*, parent:product_categories(id,name,code)',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: false,
  orgScoped: true,
};
masterData.route('', buildCrudRoutes(productCategoriesConfig));

// ────────────────────────────────────────────────────────────────────────────
// Currencies — list + show only (reference data, not org-scoped)
// ────────────────────────────────────────────────────────────────────────────

const warehousesConfig: CrudConfig = {
  table: 'warehouses',
  path: '/warehouses',
  resourceName: 'Warehouse',
  listSelect: 'id, name, code, location, type, status',
  detailSelect: '*, manager:employees(id,name), locations:storage_locations(id,code,zone,is_active)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
  updateSchema: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
    location: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    manager_id: z.string().uuid().optional().nullable(),
  }).strip(),
};
masterData.route('', buildCrudRoutes(warehousesConfig));

// ────────────────────────────────────────────────────────────────────────────
// Storage Locations — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const storageLocationsConfig: CrudConfig = {
  table: 'storage_locations',
  path: '/storage-locations',
  resourceName: 'StorageLocation',
  listSelect: 'id, code, zone, is_active, warehouse:warehouses(id,name)',
  detailSelect: '*, warehouse:warehouses(id,name,code)',
  createReturnSelect: 'id, code, zone',
  defaultSort: 'code',
  softDelete: false,
  orgScoped: true,
};
masterData.route('', buildCrudRoutes(storageLocationsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Currencies — list + show only (reference data, not org-scoped)
// ────────────────────────────────────────────────────────────────────────────

const currenciesConfig: CrudConfig = {
  table: 'currencies',
  path: '/currencies',
  resourceName: 'Currency',
  listSelect: 'currency_code, currency_name, symbol, decimal_places, is_active',
  detailSelect: '*',
  createReturnSelect: 'currency_code, currency_name',
  defaultSort: 'currency_code',
  softDelete: false,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
masterData.route('', buildCrudRoutes(currenciesConfig));

// ────────────────────────────────────────────────────────────────────────────
// UoMs — list + show only (reference data, not org-scoped)
// ────────────────────────────────────────────────────────────────────────────

const uomsConfig: CrudConfig = {
  table: 'uoms',
  path: '/uoms',
  resourceName: 'UoM',
  listSelect: 'id, uom_code, uom_name, uom_type',
  detailSelect: '*',
  createReturnSelect: 'id, uom_code, uom_name',
  defaultSort: 'uom_code',
  softDelete: false,
  orgScoped: false,
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};
masterData.route('', buildCrudRoutes(uomsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Price Lists — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const priceListsConfig: CrudConfig = {
  table: 'price_lists',
  path: '/price-lists',
  resourceName: 'PriceList',
  listSelect: 'id, code, name, currency, effective_from, effective_to, is_default, status',
  detailSelect: '*, lines:price_list_lines(*, product:products(id,name,code))',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
};
masterData.route('', buildCrudRoutes(priceListsConfig));

// ────────────────────────────────────────────────────────────────────────────
// Price List Lines — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const priceListLinesConfig: CrudConfig = {
  table: 'price_list_lines',
  path: '/price-list-lines',
  resourceName: 'PriceListLine',
  listSelect: 'id, unit_price, min_quantity, discount_rate, product:products(id,name,code)',
  detailSelect: '*, product:products(id,name,code), price_list:price_lists(id,code,name)',
  createReturnSelect: 'id, unit_price, min_quantity',
  defaultSort: 'created_at',
  softDelete: false,
  orgScoped: true,
};
masterData.route('', buildCrudRoutes(priceListLinesConfig));

// ────────────────────────────────────────────────────────────────────────────
// Carriers — full CRUD via factory
// ────────────────────────────────────────────────────────────────────────────

const carriersConfig: CrudConfig = {
  table: 'carriers',
  path: '/carriers',
  resourceName: 'Carrier',
  listSelect: 'id, code, name, carrier_type, contact, phone, tracking_url_template, is_active',
  detailSelect: '*',
  createReturnSelect: 'id, code, name',
  defaultSort: 'code',
  softDelete: true,
  orgScoped: true,
};
masterData.route('', buildCrudRoutes(carriersConfig));

export default masterData;
