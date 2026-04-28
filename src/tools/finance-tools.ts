// src/tools/finance-tools.ts
// Finance domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atomicStatusTransition, executeWithAudit } from '../utils/database';

export function createFinanceTools(db: SupabaseClient, organizationId: string, userId: string) {
  return {
    list_vouchers: tool({
      description: 'List accounting vouchers',
      inputSchema: z.object({
        status: z.enum(['draft','approved','posted','voided','cancelled']).optional(),
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
          .is('deleted_at', null)
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
          .select('id, request_number, amount, due_date, currency, ok_to_pay, supplier:suppliers(id,name), created_at')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (okToPay !== undefined) query = query.eq('ok_to_pay', okToPay);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_approval_records: tool({
      description: 'Look up approval history for business documents (PO, invoice, etc.)',
      inputSchema: z.object({
        documentType: z.string().optional().describe('e.g. purchase_orders, supplier_invoices'),
        documentId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ documentType, documentId, limit }) => {
        let query = db
          .from('approval_records')
          .select('id, document_type, document_id, rule_id, decision_level, status, decision_by, decision_at, comments, created_at')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (documentType) query = query.eq('document_type', documentType);
        if (documentId) query = query.eq('document_id', documentId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    create_voucher: tool({
      description: 'Create an accounting voucher with debit/credit entries (requires D3 approval)',
      inputSchema: z.object({
        voucherType: z.string().describe('e.g. general, receipt, payment, transfer'),
        voucherDate: z.string().describe('ISO date string'),
        entries: z.array(z.object({
          accountSubjectId: z.string().uuid(),
          entryType: z.enum(['debit', 'credit']),
          amount: z.number().positive(),
          summary: z.string().optional(),
        })).min(2),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ voucherType, voucherDate, entries, notes, confirmed }) => {
        const totalDebit = entries.filter(e => e.entryType === 'debit').reduce((s, e) => s + e.amount, 0);
        const totalCredit = entries.filter(e => e.entryType === 'credit').reduce((s, e) => s + e.amount, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
          return {
            error: true,
            message: `Debit total (${totalDebit}) must equal credit total (${totalCredit}).`,
          };
        }

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            voucherType,
            voucherDate,
            entryCount: entries.length,
            totalDebit,
            totalCredit,
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'voucher',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');

        const voucher = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('vouchers').insert({
              organization_id: organizationId,
              voucher_number: seqData,
              voucher_type: voucherType,
              voucher_date: voucherDate,
              total_debit: totalDebit,
              total_credit: totalCredit,
              status: 'draft',
              notes: notes ?? null,
            }).select('id, voucher_number').single();
            return result as { data: { id: string; voucher_number: string } | null; error: unknown };
          },
          { action: 'create', resource: 'vouchers', userId, organizationId },
        ) as { id: string; voucher_number: string };

        const entryRows = entries.map((e, idx) => ({
          voucher_id: voucher.id,
          sequence: idx + 1,
          account_subject_id: e.accountSubjectId,
          entry_type: e.entryType,
          amount: e.amount,
          summary: e.summary ?? null,
        }));

        const { error: entryErr } = await db.from('voucher_entries').insert(entryRows);
        if (entryErr) {
          await db.from('vouchers').delete().eq('id', voucher.id);
          throw new Error(entryErr.message);
        }

        return { id: voucher.id, voucherNumber: voucher.voucher_number, status: 'draft', totalDebit, totalCredit };
      },
    }),

    void_voucher: tool({
      description: 'Void a posted voucher (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: voucher, error } = await db
          .from('vouchers')
          .select('id, voucher_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error || !voucher) throw new Error('Voucher not found');
        if (voucher.status !== 'posted') throw new Error(`Cannot void voucher in status '${voucher.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to void', id: voucher.id, voucherNumber: voucher.voucher_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'vouchers', id, organizationId, 'posted',
          { status: 'voided', voided_at: new Date().toISOString(), void_reason: reason ?? null },
          'id, voucher_number',
        );
        if (!updated) throw new Error('Voucher status changed concurrently; please retry');

        return { id: voucher.id, voucherNumber: voucher.voucher_number, status: 'voided' };
      },
    }),

    submit_payment_request: tool({
      description: 'Submit a draft payment request for approval (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: pr, error } = await db
          .from('payment_requests')
          .select('id, request_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Payment request not found');
        if (pr.status !== 'draft') throw new Error(`Cannot submit payment request in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to submit', id: pr.id, requestNumber: pr.request_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'payment_requests', id, organizationId, 'draft',
          { status: 'submitted', submitted_at: new Date().toISOString() },
          'id, request_number',
        );
        if (!updated) throw new Error('Payment request status changed concurrently; please retry');

        return { id: pr.id, requestNumber: pr.request_number, status: 'submitted' };
      },
    }),

    approve_payment_request: tool({
      description: 'Approve a submitted payment request (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: pr, error } = await db
          .from('payment_requests')
          .select('id, request_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Payment request not found');
        if (pr.status !== 'submitted') throw new Error(`Cannot approve payment request in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to approve', id: pr.id, requestNumber: pr.request_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'payment_requests', id, organizationId, 'submitted',
          { status: 'approved', ok_to_pay: true, approved_at: new Date().toISOString() },
          'id, request_number',
        );
        if (!updated) throw new Error('Payment request status changed concurrently; please retry');

        return { id: pr.id, requestNumber: pr.request_number, status: 'approved' };
      },
    }),

    post_voucher: tool({
      description: 'Post a draft voucher to the ledger (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: voucher, error } = await db
          .from('vouchers')
          .select('id, voucher_number, status, total_debit, total_credit')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error || !voucher) throw new Error('Voucher not found');
        if (voucher.status !== 'draft') throw new Error(`Cannot post voucher in status '${voucher.status}'`);

        if (Math.abs(voucher.total_debit - voucher.total_credit) > 0.001) {
          throw new Error(`Voucher is unbalanced: debit=${voucher.total_debit}, credit=${voucher.total_credit}`);
        }

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to post', id: voucher.id, voucherNumber: voucher.voucher_number, totalDebit: voucher.total_debit };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'vouchers', id, organizationId, 'draft',
          { status: 'posted', posted_at: new Date().toISOString() },
          'id, voucher_number',
        );
        if (!updated) throw new Error('Voucher status changed concurrently; please retry');

        return { id: voucher.id, voucherNumber: voucher.voucher_number, status: 'posted' };
      },
    }),

    reject_payment_request: tool({
      description: 'Reject a submitted payment request (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: pr, error } = await db
          .from('payment_requests')
          .select('id, request_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Payment request not found');
        if (pr.status !== 'submitted') throw new Error(`Cannot reject payment request in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to reject', id: pr.id, requestNumber: pr.request_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'payment_requests', id, organizationId, 'submitted',
          { status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason ?? null },
          'id, request_number',
        );
        if (!updated) throw new Error('Payment request status changed concurrently; please retry');

        return { id: pr.id, requestNumber: pr.request_number, status: 'rejected' };
      },
    }),
  };
}
