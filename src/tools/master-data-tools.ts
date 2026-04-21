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
          const s = search.replace(/[%_]/g, '');
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
  };
}
