// src/tools/manufacturing-tools.ts
// Manufacturing domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createManufacturingTools(db: SupabaseClient, organizationId: string) {
  return {
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
  };
}
