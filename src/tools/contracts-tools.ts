// src/tools/contracts-tools.ts
// Contracts domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atomicStatusTransition, executeWithAudit } from '../utils/database';

export function createContractsTools(db: SupabaseClient, organizationId: string, userId: string) {
  return {
    list_contracts: tool({
      description: 'List contracts with optional filters by type, status, or party',
      inputSchema: z.object({
        status: z.enum(['draft','active','expired','terminated','cancelled','completed']).optional(),
        contractType: z.enum(['sales','procurement','service','framework']).optional(),
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
          .eq('organization_id', organizationId)
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

        const { data: updated } = await atomicStatusTransition(
          db, 'contracts', id, organizationId, 'draft',
          { status: 'active', activated_at: new Date().toISOString() },
          'id, contract_number',
        );
        if (!updated) throw new Error('Contract status changed concurrently; please retry');

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

        const { data: updated } = await atomicStatusTransition(
          db, 'contracts', id, organizationId, 'active',
          { status: 'terminated', terminated_at: new Date().toISOString(), termination_reason: reason ?? null },
          'id, contract_number',
        );
        if (!updated) throw new Error('Contract status changed concurrently; please retry');

        return { id: contract.id, contractNumber: contract.contract_number, status: 'terminated' };
      },
    }),

    renew_contract: tool({
      description: 'Renew an active or expired contract by creating a new version (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        newEndDate: z.string().describe('ISO date string for the renewed contract end date'),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, newEndDate, confirmed }) => {
        const { data: contract, error } = await db
          .from('contracts')
          .select('id, contract_number, status, contract_type, party_type, party_id, start_date, end_date, total_amount, currency, description')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !contract) throw new Error('Contract not found');
        if (!['active', 'expired'].includes(contract.status)) {
          throw new Error(`Cannot renew contract in status '${contract.status}'`);
        }

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run — set confirmed=true to renew (creates new contract from existing)',
            id: contract.id,
            contractNumber: contract.contract_number,
            currentEndDate: contract.end_date,
            newEndDate,
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'contract',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');

        const newStartDate = contract.end_date ?? new Date().toISOString().slice(0, 10);

        const newContract = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('contracts').insert({
              organization_id: organizationId,
              contract_number: seqData,
              contract_type: contract.contract_type,
              party_type: contract.party_type,
              party_id: contract.party_id,
              start_date: newStartDate,
              end_date: newEndDate,
              total_amount: contract.total_amount,
              currency: contract.currency,
              description: contract.description,
              status: 'draft',
              renewed_from_id: contract.id,
            }).select('id, contract_number').single();
            return result as { data: { id: string; contract_number: string } | null; error: unknown };
          },
          { action: 'create', resource: 'contracts', resourceId: contract.id, userId, organizationId },
        ) as { id: string; contract_number: string };

        const { data: items } = await db
          .from('contract_items')
          .select('product_id, quantity, unit_price, tax_rate, amount, notes')
          .eq('contract_id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (items && items.length > 0) {
          const newItems = items.map(item => ({
            ...item,
            contract_id: newContract.id,
            organization_id: organizationId,
          }));
          const { error: itemsErr } = await db.from('contract_items').insert(newItems);
          if (itemsErr) {
            await db.from('contracts').delete().eq('id', newContract.id).eq('organization_id', organizationId);
            throw new Error(`Contract created but items copy failed: ${itemsErr.message}`);
          }
        }

        return { id: newContract.id, contractNumber: newContract.contract_number, status: 'draft', renewedFrom: contract.contract_number };
      },
    }),
  };
}
