// src/tools/reporting-tools.ts
// Reporting and analytics tools (D0 — read only)

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createReportingTools(db: SupabaseClient, organizationId: string) {
  return {
    get_procurement_summary: tool({
      description: 'Get procurement summary: total POs, pending receipts, and outstanding payables',
      inputSchema: z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }),
      execute: async ({ fromDate, toDate }) => {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        if (fromDate && !dateRe.test(fromDate)) throw new Error('Invalid fromDate format, expected YYYY-MM-DD');
        if (toDate && !dateRe.test(toDate)) throw new Error('Invalid toDate format, expected YYYY-MM-DD');

        const { data, error } = await db.rpc('rpc_procurement_summary', {
          p_org_id: organizationId,
          p_from_date: fromDate ?? null,
          p_to_date: toDate ?? null,
        });
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        const byStatus: Record<string, { count: number; total: number }> = {};
        let totalOrders = 0;
        for (const r of rows) {
          byStatus[r.status] = { count: Number(r.order_count), total: Number(r.total_amount) };
          totalOrders += Number(r.order_count);
        }
        return { byStatus, totalOrders };
      },
    }),

    get_sales_summary: tool({
      description: 'Get sales summary: revenue by period and customer',
      inputSchema: z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        groupBy: z.enum(['customer', 'product', 'month']).default('month'),
      }),
      execute: async ({ fromDate, toDate, groupBy }) => {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        if (fromDate && !dateRe.test(fromDate)) throw new Error('Invalid fromDate format, expected YYYY-MM-DD');
        if (toDate && !dateRe.test(toDate)) throw new Error('Invalid toDate format, expected YYYY-MM-DD');

        if (groupBy === 'customer') {
          const { data, error } = await db.rpc('rpc_sales_summary_by_customer', {
            p_org_id: organizationId,
            p_from_date: fromDate ?? null,
            p_to_date: toDate ?? null,
          });
          if (error) throw new Error(error.message);
          const rows = data ?? [];
          const breakdown: Record<string, { name: string; count: number; total: number }> = {};
          let revenue = 0, orderCount = 0;
          for (const r of rows) {
            breakdown[r.customer_id] = { name: r.customer_name, count: Number(r.order_count), total: Number(r.total_amount) };
            revenue += Number(r.total_amount);
            orderCount += Number(r.order_count);
          }
          return { totalRevenue: revenue, orderCount, groupBy: 'customer', breakdown };
        }

        if (groupBy === 'product') {
          const { data, error } = await db.rpc('rpc_sales_summary_by_product', {
            p_org_id: organizationId,
            p_from_date: fromDate ?? null,
            p_to_date: toDate ?? null,
          });
          if (error) throw new Error(error.message);
          const rows = data ?? [];
          const breakdown: Record<string, { name: string; code: string; qty: number; total: number }> = {};
          let revenue = 0;
          for (const r of rows) {
            breakdown[r.product_id] = { name: r.product_name, code: r.product_code, qty: Number(r.total_qty), total: Number(r.total_amount) };
            revenue += Number(r.total_amount);
          }
          return { totalRevenue: revenue, orderCount: rows.length, groupBy: 'product', breakdown };
        }

        // Default: by month
        const { data, error } = await db.rpc('rpc_sales_summary_by_month', {
          p_org_id: organizationId,
          p_from_date: fromDate ?? null,
          p_to_date: toDate ?? null,
        });
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        const breakdown: Record<string, { count: number; total: number }> = {};
        let revenue = 0, orderCount = 0;
        for (const r of rows) {
          breakdown[r.month] = { count: Number(r.order_count), total: Number(r.total_amount) };
          revenue += Number(r.total_amount);
          orderCount += Number(r.order_count);
        }
        return { totalRevenue: revenue, orderCount, groupBy: 'month', breakdown };
      },
    }),

    get_finance_summary: tool({
      description: 'Get finance summary: voucher stats, payment totals, and budget utilization',
      inputSchema: z.object({
        year: z.number().int().min(2020).max(2030).optional(),
      }),
      execute: async ({ year }) => {
        const currentYear = year ?? new Date().getFullYear();
        const fromDate = `${currentYear}-01-01`;
        const toDate = `${currentYear}-12-31`;

        const [voucherRes, paymentReqRes, paymentRecRes] = await Promise.all([
          db.from('vouchers')
            .select('status, total_debit')
            .eq('organization_id', organizationId)
            .gte('voucher_date', fromDate)
            .lte('voucher_date', toDate)
            .limit(5000),
          db.from('payment_requests')
            .select('ok_to_pay, amount, currency')
            .eq('organization_id', organizationId)
            .is('deleted_at', null)
            .gte('created_at', fromDate)
            .lte('created_at', toDate)
            .limit(5000),
          db.from('payment_records')
            .select('amount')
            .eq('organization_id', organizationId)
            .gte('payment_date', fromDate)
            .lte('payment_date', toDate)
            .limit(5000),
        ]);

        if (voucherRes.error) throw new Error(voucherRes.error.message);
        if (paymentReqRes.error) throw new Error(paymentReqRes.error.message);
        if (paymentRecRes.error) throw new Error(paymentRecRes.error.message);

        const vouchers = voucherRes.data ?? [];
        const voucherByStatus = vouchers.reduce((acc: Record<string, { count: number; total: number }>, v: any) => {
          if (!acc[v.status]) acc[v.status] = { count: 0, total: 0 };
          acc[v.status]!.count++;
          acc[v.status]!.total += Number(v.total_debit ?? 0);
          return acc;
        }, {});

        const paymentRequests = paymentReqRes.data ?? [];
        const pendingPayments = paymentRequests.filter((r: any) => !r.ok_to_pay).length;
        const approvedPayments = paymentRequests.filter((r: any) => r.ok_to_pay).length;

        const paidTotal = (paymentRecRes.data ?? []).reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);

        return {
          year: currentYear,
          vouchers: { byStatus: voucherByStatus, totalCount: vouchers.length },
          paymentRequests: { total: paymentRequests.length, pending: pendingPayments, approved: approvedPayments },
          paymentsPaid: { count: (paymentRecRes.data ?? []).length, totalAmount: paidTotal },
        };
      },
    }),

    get_manufacturing_summary: tool({
      description: 'Get manufacturing summary: work order completion rates and production output',
      inputSchema: z.object({
        fromDate: z.string().optional().describe('ISO date YYYY-MM-DD'),
        toDate: z.string().optional().describe('ISO date YYYY-MM-DD'),
      }),
      execute: async ({ fromDate, toDate }) => {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        if (fromDate && !dateRe.test(fromDate)) throw new Error('Invalid fromDate format');
        if (toDate && !dateRe.test(toDate)) throw new Error('Invalid toDate format');

        const { data, error } = await db.rpc('rpc_manufacturing_summary', {
          p_org_id: organizationId,
          p_from_date: fromDate ?? null,
          p_to_date: toDate ?? null,
        });
        if (error) throw new Error(error.message);

        const rows = data ?? [];
        const byStatus: Record<string, { count: number; planned: number; completed: number }> = {};
        let totalOrders = 0, totalPlanned = 0, totalCompleted = 0;
        for (const r of rows) {
          byStatus[r.status] = { count: Number(r.order_count), planned: Number(r.planned_qty), completed: Number(r.completed_qty) };
          totalOrders += Number(r.order_count);
          totalPlanned += Number(r.planned_qty);
          totalCompleted += Number(r.completed_qty);
        }
        const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

        return {
          totalOrders,
          totalPlannedQty: totalPlanned,
          totalCompletedQty: totalCompleted,
          completionRate: `${completionRate}%`,
          byStatus,
        };
      },
    }),

    get_inventory_valuation: tool({
      description: 'Get inventory valuation summary',
      inputSchema: z.object({ warehouseId: z.string().uuid().optional() }),
      execute: async ({ warehouseId }) => {
        const { data, error } = await db.rpc('rpc_inventory_valuation', {
          p_org_id: organizationId,
          p_warehouse_id: warehouseId ?? null,
        });
        if (error) throw new Error(error.message);
        const row = (data ?? [])[0];
        return {
          totalSkus: Number(row?.total_skus ?? 0),
          totalQty: Number(row?.total_qty ?? 0),
        };
      },
    }),
  };
}
