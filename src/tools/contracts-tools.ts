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

    list_contract_items: tool({
      description: 'List contract line items for a specific contract',
      inputSchema: z.object({ contractId: z.string().uuid() }),
      execute: async ({ contractId }) => {
        const { data, error } = await db
          .from('contract_items')
          .select('id, quantity, unit_price, tax_rate, amount, notes, product:products(id,name,code)')
          .eq('contract_id', contractId)
          .is('deleted_at', null)
          .order('id');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    activate_contract: tool({
      description: 'Activate a draft contract (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: contract, error } = await db
          .from('contracts')
          .select('id, contract_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !contract) throw new Error('Contract not found');
        if (contract.status !== 'draft') throw new Error(`Cannot activate contract in status '${contract.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to activate', id: contract.id, contractNumber: contract.contract_number };
        }

        const { error: updateErr } = await db
          .from('contracts')
          .update({ status: 'active', activated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: contract.id, contractNumber: contract.contract_number, status: 'active' };
      },
    }),

    terminate_contract: tool({
      description: 'Terminate an active contract (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: contract, error } = await db
          .from('contracts')
          .select('id, contract_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !contract) throw new Error('Contract not found');
        if (contract.status !== 'active') throw new Error(`Cannot terminate contract in status '${contract.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to terminate', id: contract.id, contractNumber: contract.contract_number };
        }

        const { error: updateErr } = await db
          .from('contracts')
          .update({ status: 'terminated', terminated_at: new Date().toISOString(), termination_reason: reason ?? null })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: contract.id, contractNumber: contract.contract_number, status: 'terminated' };
      },
    }),
  };
}
