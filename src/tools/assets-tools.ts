// src/tools/assets-tools.ts
// Fixed assets domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createAssetsTools(db: SupabaseClient, organizationId: string) {
  return {
    list_fixed_assets: tool({
      description: 'List fixed assets with optional filters',
      inputSchema: z.object({
        status: z.enum(['active','disposed','idle','under_maintenance']).optional(),
        category: z.string().optional(),
        search: z.string().optional().describe('Search by asset number or name'),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, category, search, limit }) => {
        let query = db
          .from('fixed_assets')
          .select('id, asset_number, asset_name, category, status, acquisition_date, acquisition_cost, current_book_value, location, custodian:employees!custodian_id(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (category) query = query.eq('category', category);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`asset_number.ilike.%${s}%,asset_name.ilike.%${s}%`);
        }

        const { data, error } = await query.order('asset_number').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_fixed_asset: tool({
      description: 'Get fixed asset detail including depreciation schedule and maintenance history',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('fixed_assets')
          .select(`
            *,
            custodian:employees!custodian_id(id,name),
            cost_center:cost_centers(id,name,code),
            depreciations:asset_depreciations(id,period_year,period_month,depreciation_amount,accumulated_depreciation,book_value_after),
            maintenance:asset_maintenance_records(id,performed_at,maintenance_type,cost,description)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_asset_depreciations: tool({
      description: 'List depreciation records for a fixed asset',
      inputSchema: z.object({
        assetId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(36),
      }),
      execute: async ({ assetId, limit }) => {
        const { data, error } = await db
          .from('asset_depreciations')
          .select('id, period_year, period_month, depreciation_amount, accumulated_depreciation, book_value_after, posted')
          .eq('asset_id', assetId)
          .order('period_year', { ascending: false })
          .order('period_month', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_asset_maintenance: tool({
      description: 'List maintenance records for a fixed asset',
      inputSchema: z.object({
        assetId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ assetId, limit }) => {
        const { data, error } = await db
          .from('asset_maintenance_records')
          .select('id, maintenance_type, description, cost, performed_by, performed_at, next_due_at')
          .eq('asset_id', assetId)
          .is('deleted_at', null)
          .order('performed_at', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
