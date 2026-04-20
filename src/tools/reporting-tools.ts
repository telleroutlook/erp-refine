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
        let sql = `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0)::float AS total
          FROM purchase_orders
          WHERE organization_id = '${organizationId}' AND deleted_at IS NULL`;
        if (fromDate) sql += ` AND order_date >= '${fromDate}'`;
        if (toDate) sql += ` AND order_date <= '${toDate}'`;
        sql += ` GROUP BY status`;

        const { data, error } = await db.rpc('exec_sql', { query: sql }).maybeSingle();

        if (error) {
          let query = db
            .from('purchase_orders')
            .select('status, total_amount')
            .eq('organization_id', organizationId)
            .is('deleted_at', null);
          if (fromDate) query = query.gte('order_date', fromDate);
          if (toDate) query = query.lte('order_date', toDate);
          const { data: rows, error: e2 } = await query.limit(5000);
          if (e2) throw new Error(e2.message);
          const summary = (rows ?? []).reduce((acc: Record<string, { count: number; total: number }>, row: any) => {
            if (!acc[row.status]) acc[row.status] = { count: 0, total: 0 };
            acc[row.status]!.count++;
            acc[row.status]!.total += Number(row.total_amount);
            return acc;
          }, {});
          return { byStatus: summary, totalOrders: (rows ?? []).length, truncated: (rows ?? []).length >= 5000 };
        }

        const rows = Array.isArray(data) ? data : [];
        const byStatus: Record<string, { count: number; total: number }> = {};
        let totalOrders = 0;
        for (const row of rows) {
          byStatus[row.status] = { count: row.count, total: row.total };
          totalOrders += row.count;
        }
        return { byStatus, totalOrders, truncated: false };
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
          items: data ?? [],
        };
      },
    }),
  };
}
