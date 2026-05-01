// src/tools/master-data-tools.ts
// Master data lookup tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createMasterDataTools(db: SupabaseClient, organizationId: string) {
  return {
    list_products: tool({
      description: 'List products with optional search',
      inputSchema: z.object({
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ search, categoryId, limit }) => {
        let query = db
          .from('products')
          .select('id, name, code, description, category:product_categories(id,name), uom:uoms(id,uom_code,uom_name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) {
          const s = search.replace(/[%_,().]/g, '');
          query = query.or(`name.ilike.%${s}%,code.ilike.%${s}%`);
        }
        if (categoryId) query = query.eq('category_id', categoryId);

        const { data, error } = await query.order('name').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_currencies: tool({
      description: 'List available currencies',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('currencies')
          .select('currency_code, currency_name, symbol')
          .order('currency_code');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_departments: tool({
      description: 'List organization departments',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('departments')
          .select('id, name, code, parent_id')
          .eq('organization_id', organizationId)
          .order('name');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_employees: tool({
      description: 'List active employees',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('employees')
          .select('id, employee_number, name, email, department:departments!department_id(id,name)')
          .eq('organization_id', organizationId);

        if (search) {
          const s = search.replace(/[%_,().]/g, '');
          query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
        }

        const { data, error } = await query.order('name').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_exchange_rates: tool({
      description: 'Look up exchange rates between currencies',
      inputSchema: z.object({
        fromCurrency: z.string().length(3).optional(),
        toCurrency: z.string().length(3).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ fromCurrency, toCurrency, limit }) => {
        let query = db
          .from('exchange_rates')
          .select('id, from_currency, to_currency, rate, effective_date')
          .eq('organization_id', organizationId);

        if (fromCurrency) query = query.eq('from_currency', fromCurrency);
        if (toCurrency) query = query.eq('to_currency', toCurrency);

        const { data, error } = await query.order('effective_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_carriers: tool({
      description: 'List shipping carriers',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('carriers')
          .select('id, code, name, carrier_type, phone, tracking_url_template, is_active')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) {
          const s = search.replace(/[%_,().]/g, '');
          query = query.ilike('name', `%${s}%`);
        }

        const { data, error } = await query.order('name').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_price_lists: tool({
      description: 'List active price lists',
      inputSchema: z.object({
        currency: z.string().length(3).optional(),
        activeOnly: z.boolean().default(true),
      }),
      execute: async ({ currency, activeOnly }) => {
        let query = db
          .from('price_lists')
          .select('id, code, name, currency, effective_from, effective_to, is_default, status')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (currency) query = query.eq('currency', currency);
        if (activeOnly) query = query.eq('status', 'active');

        const { data, error } = await query.order('code').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_uoms: tool({
      description: 'List units of measure (UoM)',
      inputSchema: z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ search, limit }) => {
        let query = db
          .from('uoms')
          .select('id, uom_code, uom_name, uom_type, base_uom_id, conversion_factor');

        if (search) {
          const s = search.replace(/[%_,().]/g, '');
          query = query.or(`uom_code.ilike.%${s}%,uom_name.ilike.%${s}%`);
        }

        const { data, error } = await query.order('uom_code').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_number_sequences: tool({
      description: 'List auto-numbering sequences configured for the organization',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('number_sequences')
          .select('id, sequence_name, prefix, current_value, padding, increment_by')
          .eq('organization_id', organizationId)
          .order('sequence_name');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_organizations: tool({
      description: 'Get the current user\'s organization details',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('organizations')
          .select('id, name, code, email, phone, plan, status')
          .eq('id', organizationId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_storage_locations: tool({
      description: 'List storage locations (bins/racks) within warehouses',
      inputSchema: z.object({
        warehouseId: z.string().uuid().optional(),
        limit: z.number().min(1).max(200).default(100),
      }),
      execute: async ({ warehouseId, limit }) => {
        let query = db
          .from('storage_locations')
          .select('id, code, name, zone, is_active, warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.order('code').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_product_categories: tool({
      description: 'List product categories (hierarchical)',
      inputSchema: z.object({
        parentId: z.string().uuid().optional(),
      }),
      execute: async ({ parentId }) => {
        let query = db
          .from('product_categories')
          .select('id, name, code, parent_id, level, is_active')
          .eq('organization_id', organizationId);

        if (parentId) query = query.eq('parent_id', parentId);

        const { data, error } = await query.order('name').limit(200);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_product: tool({
      description: 'Get product detail by ID',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('products')
          .select('*, category:product_categories(id,name,code), uom:uoms(id,uom_code,uom_name)')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_price_list_lines: tool({
      description: 'List price list lines (product prices) for a specific price list',
      inputSchema: z.object({
        priceListId: z.string().uuid(),
        productId: z.string().uuid().optional(),
        limit: z.number().min(1).max(200).default(50),
      }),
      execute: async ({ priceListId, productId, limit }) => {
        let query = db
          .from('price_list_lines')
          .select('id, price_list_id, product_id, unit_price, min_quantity, discount_rate, effective_from, effective_to, created_at')
          .eq('price_list_id', priceListId)
          .eq('organization_id', organizationId)
          .is('deleted_at', null);
        if (productId) query = query.eq('product_id', productId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_product_cost_history: tool({
      description: 'Get cost history for a product over time',
      inputSchema: z.object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ productId, limit }) => {
        const { data, error } = await db
          .from('product_cost_history')
          .select('id, product_id, unit_cost, total_value, total_quantity, cost_method, effective_date, reference_type, reference_id, created_at')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .order('effective_date', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
