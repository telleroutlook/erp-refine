// src/tools/manufacturing-tools.ts
// Manufacturing domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createManufacturingTools(db: SupabaseClient, organizationId: string) {
  return {
    get_work_order: tool({
      description: 'Get work order detail including materials and production records',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('work_orders')
          .select(`
            *, product:products(id,name,code), warehouse:warehouses(id,name,code),
            bom:bom_headers(id,bom_number),
            materials:work_order_materials(*, product:products(id,name,code)),
            productions:work_order_productions(id,production_date,quantity,defective_quantity,notes)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_bom_headers: tool({
      description: 'List bills of materials (BOM)',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ productId, search, limit }) => {
        let query = db
          .from('bom_headers')
          .select('id, bom_number, product:products(id,name,code), effective_date, is_active, version')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.ilike('bom_number', `%${s}%`);
        }

        const { data, error } = await query.order('bom_number').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_bom: tool({
      description: 'Get BOM detail with all component items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('bom_headers')
          .select(`
            *, product:products(id,name,code),
            items:bom_items(*, component:products!product_id(id,name,code), uom:uoms!unit(uom_code,uom_name))
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_work_orders: tool({
      description: 'List work orders',
      inputSchema: z.object({
        status: z.enum(['draft','released','in_progress','completed','cancelled']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('work_orders')
          .select('id, work_order_number, status, start_date, planned_completion_date, planned_quantity, completed_quantity, product:products(id,name,code)')
          .eq('organization_id', organizationId);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('start_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_work_order_materials: tool({
      description: 'List material requirements for a work order',
      inputSchema: z.object({ workOrderId: z.string().uuid() }),
      execute: async ({ workOrderId }) => {
        const { data, error } = await db
          .from('work_order_materials')
          .select('id, required_quantity, issued_quantity, status, notes, product:products(id,name,code)')
          .eq('work_order_id', workOrderId);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_work_order_productions: tool({
      description: 'List production records (output entries) for a work order',
      inputSchema: z.object({ workOrderId: z.string().uuid() }),
      execute: async ({ workOrderId }) => {
        const { data, error } = await db
          .from('work_order_productions')
          .select('id, production_date, quantity, qualified_quantity, defective_quantity, notes, created_by')
          .eq('work_order_id', workOrderId)
          .order('production_date', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
