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

        const [draftCount, postedCount, approvedCount, voidedCount,
               pendingPayCount, approvedPayCount, paymentRecRes] = await Promise.all([
          db.from('vouchers').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'draft')
            .gte('voucher_date', fromDate).lte('voucher_date', toDate),
          db.from('vouchers').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'posted')
            .gte('voucher_date', fromDate).lte('voucher_date', toDate),
          db.from('vouchers').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'approved')
            .gte('voucher_date', fromDate).lte('voucher_date', toDate),
          db.from('vouchers').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'voided')
            .gte('voucher_date', fromDate).lte('voucher_date', toDate),
          db.from('payment_requests').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).is('deleted_at', null)
            .eq('ok_to_pay', false)
            .gte('created_at', fromDate).lte('created_at', toDate),
          db.from('payment_requests').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).is('deleted_at', null)
            .eq('ok_to_pay', true)
            .gte('created_at', fromDate).lte('created_at', toDate),
          db.from('payment_records')
            .select('amount', { count: 'exact' })
            .eq('organization_id', organizationId)
            .gte('payment_date', fromDate)
            .lte('payment_date', toDate)
            .limit(5000),
        ]);

        const paidRows = paymentRecRes.data ?? [];
        const paidTotal = paidRows.reduce((sum: number, r: any) => sum + Number(r.amount ?? 0), 0);
        const paidCount = paymentRecRes.count ?? paidRows.length;

        return {
          year: currentYear,
          vouchers: {
            byStatus: {
              draft: { count: draftCount.count ?? 0 },
              posted: { count: postedCount.count ?? 0 },
              approved: { count: approvedCount.count ?? 0 },
              voided: { count: voidedCount.count ?? 0 },
            },
            totalCount: (draftCount.count ?? 0) + (postedCount.count ?? 0) + (approvedCount.count ?? 0) + (voidedCount.count ?? 0),
          },
          paymentRequests: {
            total: (pendingPayCount.count ?? 0) + (approvedPayCount.count ?? 0),
            pending: pendingPayCount.count ?? 0,
            approved: approvedPayCount.count ?? 0,
          },
          paymentsPaid: { count: paidCount, totalAmount: paidTotal },
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

    get_customer_summary: tool({
      description: 'Get customer summary with order counts, total amounts, and unpaid orders',
      inputSchema: z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('v_customer_summary')
          .select('id, code, name, type, credit_limit, status, order_count, total_order_amount, unpaid_orders')
          .eq('organization_id', organizationId);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('total_order_amount', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_supplier_summary: tool({
      description: 'Get supplier summary with order counts, total amounts, and reliability scores',
      inputSchema: z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('v_supplier_summary')
          .select('id, code, name, supplier_type, reliability_score, status, order_count, total_order_amount, open_orders')
          .eq('organization_id', organizationId);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('total_order_amount', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_purchase_order_overview: tool({
      description: 'Get purchase order overview with line counts and receipt progress',
      inputSchema: z.object({
        status: z.string().optional(),
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, supplierId, limit }) => {
        let query = db
          .from('v_purchase_order_summary')
          .select('id, order_number, order_date, expected_date, supplier_id, supplier_name, total_amount, currency, status, line_count, total_quantity, total_received, created_at')
          .eq('organization_id', organizationId);
        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_sales_order_overview: tool({
      description: 'Get sales order overview with line counts, shipment progress, and payment status',
      inputSchema: z.object({
        status: z.string().optional(),
        customerId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, customerId, limit }) => {
        let query = db
          .from('v_sales_order_summary')
          .select('id, order_number, order_date, delivery_date, customer_id, customer_name, total_amount, currency, status, payment_status, line_count, total_quantity, total_shipped, created_at')
          .eq('organization_id', organizationId);
        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_stock_overview: tool({
      description: 'Get stock summary across warehouses with stock status (normal, low, overstock)',
      inputSchema: z.object({
        warehouseId: z.string().uuid().optional(),
        stockStatus: z.enum(['normal', 'low', 'overstock']).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ warehouseId, stockStatus, search, limit }) => {
        let query = db
          .from('v_stock_summary')
          .select('id, warehouse_id, warehouse_name, product_id, product_code, product_name, unit, quantity_on_hand, quantity_reserved, quantity_available, min_stock, max_stock, stock_status, updated_at')
          .eq('organization_id', organizationId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);
        if (stockStatus) query = query.eq('stock_status', stockStatus);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`product_name.ilike.%${s}%,product_code.ilike.%${s}%`);
        }
        const { data, error } = await query.order('product_name').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_pending_approvals: tool({
      description: 'Get AI agent decisions pending human approval',
      inputSchema: z.object({
        riskLevel: z.string().optional().describe('Filter by risk level'),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ riskLevel, limit }) => {
        let query = db
          .from('v_pending_approvals')
          .select('decision_id, agent_id, risk_level, decision, tools_called, reasoning_summary, confidence, created_at, requested_by_name')
          .eq('organization_id', organizationId);
        if (riskLevel) query = query.eq('risk_level', riskLevel);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
