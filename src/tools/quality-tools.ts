// src/tools/quality-tools.ts
// Quality domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createQualityTools(db: SupabaseClient, organizationId: string) {
  return {
    get_quality_inspection: tool({
      description: 'Get quality inspection detail with all inspection items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('quality_inspections')
          .select(`
            *, product:products(id,name,code), inspector:employees(id,name),
            items:quality_inspection_items(id,check_item,check_result,check_standard,measured_value,notes)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_quality_standards: tool({
      description: 'List quality standards',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        status: z.enum(['active','inactive']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ productId, status, limit }) => {
        let query = db
          .from('quality_standards')
          .select('id, standard_code, standard_name, is_active, product:products(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (productId) query = query.eq('product_id', productId);
        if (status === 'active') query = query.eq('is_active', true);
        else if (status === 'inactive') query = query.eq('is_active', false);

        const { data, error } = await query.order('standard_code').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_defect_codes: tool({
      description: 'List defect codes used in quality inspections',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('defect_codes')
          .select('id, code, name, category, severity')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
        }

        const { data, error } = await query.order('code').limit(100);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_quality_inspections: tool({
      description: 'List quality inspections with optional filters',
      inputSchema: z.object({
        status: z.enum(['draft','in_progress','completed','cancelled']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('quality_inspections')
          .select('id, inspection_number, status, inspection_date, reference_type, reference_id, inspector:employees(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('inspection_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
