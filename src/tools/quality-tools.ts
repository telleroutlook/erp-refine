// src/tools/quality-tools.ts
// Quality domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createQualityTools(db: SupabaseClient, organizationId: string) {
  return {
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
