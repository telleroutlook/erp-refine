// src/tools/contracts-tools.ts
// Contracts domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createContractsTools(db: SupabaseClient, organizationId: string) {
  return {
    list_contracts: tool({
      description: 'List contracts with optional filters by type, status, or party',
      inputSchema: z.object({
        status: z.enum(['draft','active','expired','terminated','closed']).optional(),
        contractType: z.enum(['purchase','sales','service','lease','other']).optional(),
        search: z.string().optional().describe('Search by contract number or description'),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, contractType, search, limit }) => {
        let query = db
          .from('contracts')
          .select('id, contract_number, contract_type, party_type, status, start_date, end_date, total_amount, currency')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (contractType) query = query.eq('contract_type', contractType);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`contract_number.ilike.%${s}%,description.ilike.%${s}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_contract: tool({
      description: 'Get contract detail with all line items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('contracts')
          .select(`
            *,
            items:contract_items(*, product:products(id,name,code))
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),
  };
}
