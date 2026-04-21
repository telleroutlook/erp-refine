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

        let query = db
          .from('purchase_orders')
          .select('status, total_amount')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);
        if (fromDate) query = query.gte('order_date', fromDate);
        if (toDate) query = query.lte('order_date', toDate);
        const { data: rows, error } = await query.limit(5000);
        if (error) throw new Error(error.message);
        const summary = (rows ?? []).reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
          if (!acc[row.status]) acc[row.status] = { count: 0, total: 0 };
          acc[row.status]!.count++;
          acc[row.status]!.total += Number(row.total_amount);
          return acc;
        }, {});
        return { byStatus: summary, totalOrders: (rows ?? []).length, truncated: (rows ?? []).length >= 5000 };
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

        let query = db
          .from('sales_orders')
          .select('status, total_amount, currency, order_date, customer:customers(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (fromDate) query = query.gte('order_date', fromDate);
        if (toDate) query = query.lte('order_date', toDate);

        const { data, error } = await query.limit(5000);
        if (error) throw new Error(error.message);

        const active = (data ?? []).filter((r: any) => !['cancelled', 'draft'].includes(r.status));
        const revenue = active.reduce((sum: number, r: any) => sum + Number(r.total_amount), 0);

        if (!groupBy || groupBy === 'month') {
          const byMonth: Record<string, { count: number; total: number }> = {};
          for (const r of active) {
            const month = (r.order_date as string).slice(0, 7);
            if (!byMonth[month]) byMonth[month] = { count: 0, total: 0 };
            byMonth[month]!.count++;
            byMonth[month]!.total += Number(r.total_amount);
          }
          return { totalRevenue: revenue, orderCount: active.length, groupBy: 'month', breakdown: byMonth };
        }

        if (groupBy === 'customer') {
          const byCustomer: Record<string, { name: string; count: number; total: number }> = {};
          for (const r of active) {
            const id: string = (r.customer as any)?.id ?? 'unknown';
            const name: string = (r.customer as any)?.name ?? 'Unknown';
            if (!byCustomer[id]) byCustomer[id] = { name, count: 0, total: 0 };
            byCustomer[id]!.count++;
            byCustomer[id]!.total += Number(r.total_amount);
          }
          return { totalRevenue: revenue, orderCount: active.length, groupBy: 'customer', breakdown: byCustomer };
        }

        if (groupBy === 'product') {
          let itemQuery = db
            .from('sales_order_items')
            .select('quantity, unit_price, product:products(id,name,code), sales_order:sales_orders!inner(status, organization_id, order_date)')
            .eq('sales_order.organization_id', organizationId)
            .not('sales_order.status', 'in', '("cancelled","draft")');
          if (fromDate) itemQuery = itemQuery.gte('sales_order.order_date', fromDate);
          if (toDate) itemQuery = itemQuery.lte('sales_order.order_date', toDate);

          const { data: itemData, error: itemError } = await itemQuery.limit(5000);
          if (itemError) throw new Error(itemError.message);

          const byProduct: Record<string, { name: string; code: string; qty: number; total: number }> = {};
          for (const i of (itemData ?? [])) {
            const id: string = (i.product as any)?.id ?? 'unknown';
            const name: string = (i.product as any)?.name ?? 'Unknown';
            const code: string = (i.product as any)?.code ?? '';
            if (!byProduct[id]) byProduct[id] = { name, code, qty: 0, total: 0 };
            byProduct[id]!.qty += Number(i.quantity);
            byProduct[id]!.total += Number(i.quantity) * Number(i.unit_price);
          }
          return { totalRevenue: revenue, orderCount: active.length, groupBy: 'product', breakdown: byProduct };
        }

        return { totalRevenue: revenue, orderCount: active.length };
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

        let query = db
          .from('work_orders')
          .select('status, planned_quantity, completed_quantity')
          .eq('organization_id', organizationId);

        if (fromDate) query = query.gte('start_date', fromDate);
        if (toDate) query = query.lte('start_date', toDate);

        const { data, error } = await query.limit(5000);
        if (error) throw new Error(error.message);

        const rows = data ?? [];
        const byStatus = rows.reduce((acc: Record<string, { count: number; planned: number; completed: number }>, r: any) => {
          if (!acc[r.status]) acc[r.status] = { count: 0, planned: 0, completed: 0 };
          acc[r.status]!.count++;
          acc[r.status]!.planned += Number(r.planned_quantity ?? 0);
          acc[r.status]!.completed += Number(r.completed_quantity ?? 0);
          return acc;
        }, {});

        const totalPlanned = rows.reduce((s: number, r: any) => s + Number(r.planned_quantity ?? 0), 0);
        const totalCompleted = rows.reduce((s: number, r: any) => s + Number(r.completed_quantity ?? 0), 0);
        const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

        return {
          totalOrders: rows.length,
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
        let query = db
          .from('stock_records')
          .select('quantity, product:products(id,name,code)')
          .eq('organization_id', organizationId);

        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.limit(5000);
        if (error) throw new Error(error.message);

        return {
          totalSkus: (data ?? []).length,
          totalQty: (data ?? []).reduce((sum: number, r: any) => sum + Number(r.quantity ?? 0), 0),
        };
      },
    }),
  };
}
