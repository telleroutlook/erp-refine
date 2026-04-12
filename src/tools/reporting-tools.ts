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
        let query = db
          .from('purchase_orders')
          .select('status, total_amount, currency')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (fromDate) query = query.gte('order_date', fromDate);
        if (toDate) query = query.lte('order_date', toDate);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const summary = (data ?? []).reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
          if (!acc[row.status]) acc[row.status] = { count: 0, total: 0 };
          acc[row.status]!.count++;
          acc[row.status]!.total += Number(row.total_amount);
          return acc;
        }, {});

        return { byStatus: summary, totalOrders: (data ?? []).length };
      },
    }),

    get_sales_summary: tool({
      description: 'Get sales summary: revenue by period and customer',
      inputSchema: z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        groupBy: z.enum(['customer', 'product', 'month']).default('month'),
      }),
      execute: async ({ fromDate, toDate }) => {
        let query = db
          .from('sales_orders')
          .select('status, total_amount, currency, order_date, customer:customers(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (fromDate) query = query.gte('order_date', fromDate);
        if (toDate) query = query.lte('order_date', toDate);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const revenue = (data ?? [])
          .filter((r: any) => !['cancelled', 'draft'].includes(r.status))
          .reduce((sum: number, r: any) => sum + Number(r.total_amount), 0);

        return { totalRevenue: revenue, orderCount: (data ?? []).length };
      },
    }),

    get_inventory_valuation: tool({
      description: 'Get inventory valuation summary',
      inputSchema: z.object({ warehouseId: z.string().uuid().optional() }),
      execute: async ({ warehouseId }) => {
        let query = db
          .from('stock_records')
          .select('qty_on_hand, product:products(id,name,code)')
          .eq('organization_id', organizationId);

        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return {
          totalSkus: (data ?? []).length,
          totalQty: (data ?? []).reduce((sum: number, r: any) => sum + r.qty_on_hand, 0),
          items: data ?? [],
        };
      },
    }),
  };
}
