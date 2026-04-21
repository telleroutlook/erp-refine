// src/tools/finance-tools.ts
// Finance domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createFinanceTools(db: SupabaseClient, organizationId: string) {
  return {
    list_vouchers: tool({
      description: 'List accounting vouchers',
      inputSchema: z.object({
        status: z.enum(['draft','posted','void']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('vouchers')
          .select('id, voucher_number, voucher_date, notes, total_debit, total_credit, status')
          .eq('organization_id', organizationId);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('voucher_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_budget_vs_actual: tool({
      description: 'Compare budget vs actual spending by period',
      inputSchema: z.object({
        year: z.number().int().min(2020).max(2030),
      }),
      execute: async ({ year }) => {
        const query = db
          .from('budgets')
          .select('id, budget_name, budget_year, budget_lines(account:account_subjects(name), planned_amount, actual_amount)')
          .eq('organization_id', organizationId)
          .eq('budget_year', year)
          .is('deleted_at', null);

        const { data, error } = await query.limit(200);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_account_subjects: tool({
      description: 'List chart of accounts (account subjects)',
      inputSchema: z.object({
        parentId: z.string().uuid().optional().describe('Filter by parent subject for subtree'),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      }),
      execute: async ({ parentId, search, limit }) => {
        let query = db
          .from('account_subjects')
          .select('id, code, name, category, balance_direction, parent_id, is_leaf, status')
          .eq('organization_id', organizationId);

        if (parentId) query = query.eq('parent_id', parentId);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
        }

        const { data, error } = await query.order('code').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_cost_centers: tool({
      description: 'List cost centers',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('cost_centers')
          .select('id, code, name, parent_id')
          .eq('organization_id', organizationId)
          .order('code');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_budgets: tool({
      description: 'List budgets with optional year filter',
      inputSchema: z.object({
        year: z.number().int().min(2020).max(2030).optional(),
        status: z.enum(['draft','approved','active','closed']).optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ year, status, limit }) => {
        let query = db
          .from('budgets')
          .select('id, budget_name, budget_year, budget_type, status, total_amount, currency')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (year) query = query.eq('budget_year', year);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('budget_year', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_payment_records: tool({
      description: 'List payment records (executed payments)',
      inputSchema: z.object({
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ supplierId, limit }) => {
        let query = db
          .from('payment_records')
          .select('id, payment_number, payment_date, amount, payment_method, payment_type, status, partner_id, partner_type')
          .eq('organization_id', organizationId);

        if (supplierId) query = query.eq('partner_id', supplierId);

        const { data, error } = await query.order('payment_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_payment_requests: tool({
      description: 'List payment requests awaiting approval',
      inputSchema: z.object({
        okToPay: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ okToPay, limit }) => {
        let query = db
          .from('payment_requests')
          .select('id, request_number, amount, due_date, currency, ok_to_pay_flag, supplier:suppliers(id,name), created_at')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (okToPay !== undefined) query = query.eq('ok_to_pay_flag', okToPay);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
