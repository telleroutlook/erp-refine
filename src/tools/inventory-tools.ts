// src/tools/inventory-tools.ts
// Inventory domain tools — LLM-callable via Vercel AI SDK

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createInventoryTools(db: SupabaseClient, organizationId: string) {
  return {
    get_stock_levels: tool({
      description: 'Get current stock levels for products, optionally filtered by warehouse or product',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        warehouseId: z.string().uuid().optional(),
        lowStockOnly: z.boolean().optional().describe('Only return products with zero or negative available qty'),
        limit: z.number().min(1).max(500).default(200),
      }),
      execute: async ({ productId, warehouseId, lowStockOnly, limit }) => {
        let query = db
          .from('stock_records')
          .select('id, qty_on_hand, qty_reserved, qty_available, product:products(id,name,code), warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.order('qty_on_hand', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);

        const result = (data ?? []).map((r: any) => ({ ...r }));
        return lowStockOnly ? result.filter((r: any) => r.qty_available <= 0) : result;
      },
    }),

    get_stock_transactions: tool({
      description: 'Get stock movement history',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        warehouseId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ productId, warehouseId, limit }) => {
        let query = db
          .from('stock_transactions')
          .select('id, transaction_type, quantity, reference_type, reference_id, product:products(id,name,code), warehouse:warehouses(id,name), created_at')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_warehouses: tool({
      description: 'List all active warehouses',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('warehouses')
          .select('id, name, code, location')
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .order('name');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
