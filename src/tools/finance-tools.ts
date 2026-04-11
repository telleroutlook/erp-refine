// src/tools/finance-tools.ts
// Finance domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createFinanceTools(db: SupabaseClient, organizationId: string) {
  return {
    list_vouchers: tool({
      description: 'List accounting vouchers',
      parameters: z.object({
        status: z.enum(['draft','posted','void']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('vouchers')
          .select('id, voucher_number, voucher_date, description, total_debit, total_credit, status')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('voucher_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_budget_vs_actual: tool({
      description: 'Compare budget vs actual spending by department and period',
      parameters: z.object({
        year: z.number().int().min(2020).max(2030),
        departmentId: z.string().uuid().optional(),
      }),
      execute: async ({ year, departmentId }) => {
        let query = db
          .from('budgets')
          .select('id, name, fiscal_year, department:departments(id,name), budget_lines(account:account_subjects(name), budgeted_amount, actual_amount)')
          .eq('organization_id', organizationId)
          .eq('fiscal_year', year)
          .is('deleted_at', null);

        if (departmentId) query = query.eq('department_id', departmentId);

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_payment_requests: tool({
      description: 'List payment requests awaiting approval',
      parameters: z.object({
        okToPay: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ okToPay, limit }) => {
        let query = db
          .from('payment_requests')
          .select('id, request_number, amount, currency, due_date, ok_to_pay, supplier:suppliers(id,name), created_at')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (okToPay !== undefined) query = query.eq('ok_to_pay', okToPay);

        const { data, error } = await query.order('due_date', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
