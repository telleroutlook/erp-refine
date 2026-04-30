// src/tools/inventory-tools.ts
// Inventory domain tools — LLM-callable via Vercel AI SDK

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeWithAudit } from '../utils/database';

export function createInventoryTools(db: SupabaseClient, organizationId: string, userId: string) {
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
          .select('id, quantity, reserved_quantity, available_quantity, product:products(id,name,code), warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);
        if (lowStockOnly) query = query.lte('available_quantity', 0);

        const { data, error } = await query.order('available_quantity', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);

        return (data ?? []).map((r: any) => ({ ...r }));
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

    list_inventory_lots: tool({
      description: 'List inventory lots (batch tracking)',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        warehouseId: z.string().uuid().optional(),
        status: z.enum(['active','expired','quarantine','consumed']).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ productId, warehouseId, status, limit }) => {
        let query = db
          .from('inventory_lots')
          .select('id, lot_number, status, expiry_date, quantity, product:products(id,name,code), warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (productId) query = query.eq('product_id', productId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('expiry_date', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_serial_numbers: tool({
      description: 'List serial numbers for serialized inventory items',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        status: z.enum(['in_stock','sold','returned','scrapped']).optional(),
        search: z.string().optional().describe('Search by serial number'),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ productId, status, search, limit }) => {
        let query = db
          .from('serial_numbers')
          .select('id, serial_number, status, product:products(id,name,code), warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (status) query = query.eq('status', status);
        if (search) { const s = search.replace(/[%_]/g, ''); query = query.ilike('serial_number', `%${s}%`); }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_inventory_counts: tool({
      description: 'List inventory count (stocktake) sessions',
      inputSchema: z.object({
        status: z.enum(['draft','in_progress','completed','cancelled']).optional(),
        warehouseId: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
      execute: async ({ status, warehouseId, limit }) => {
        let query = db
          .from('inventory_counts')
          .select('id, count_number, status, count_date, warehouse:warehouses(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.order('count_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_low_stock_alerts: tool({
      description: 'Get low stock alerts — products below reorder point or with zero available qty',
      inputSchema: z.object({ warehouseId: z.string().uuid().optional() }),
      execute: async ({ warehouseId }) => {
        let query = db
          .from('v_low_stock_alerts')
          .select('product_id, product_name, product_code, warehouse_id, warehouse_name, available_quantity, min_stock, days_of_stock, alert_level')
          .eq('organization_id', organizationId);

        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data, error } = await query.order('available_quantity', { ascending: true }).limit(200);
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

    list_inventory_reservations: tool({
      description: 'List inventory reservations (stock held for orders)',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        warehouseId: z.string().uuid().optional(),
        referenceType: z.string().optional().describe('e.g. sales_orders'),
        status: z.enum(['active', 'released', 'expired']).optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ productId, warehouseId, referenceType, status, limit }) => {
        let query = db
          .from('inventory_reservations')
          .select('id, reserved_quantity, reference_type, reference_id, status, expires_at, reserved_by, product:products(id,name,code), warehouse:warehouses(id,name)')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);
        if (referenceType) query = query.eq('reference_type', referenceType);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    transfer_stock: tool({
      description: 'Transfer stock between warehouses (D2 — requires confirmation). Creates out+in stock transactions.',
      inputSchema: z.object({
        productId: z.string().uuid(),
        fromWarehouseId: z.string().uuid(),
        toWarehouseId: z.string().uuid(),
        quantity: z.number().positive(),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ productId, fromWarehouseId, toWarehouseId, quantity, notes, confirmed }) => {
        if (fromWarehouseId === toWarehouseId) throw new Error('Source and destination warehouses must be different');

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run — set confirmed=true to execute transfer',
            productId,
            fromWarehouseId,
            toWarehouseId,
            quantity,
          };
        }

        const { data: stock, error: stockErr } = await db
          .from('stock_records')
          .select('id, available_quantity')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .eq('warehouse_id', fromWarehouseId)
          .single();

        if (stockErr || !stock) throw new Error('No stock record found for source warehouse');
        if ((stock.available_quantity ?? 0) < quantity) throw new Error(`Insufficient stock: available=${stock.available_quantity}, requested=${quantity}`);

        const txnBase = {
          organization_id: organizationId,
          product_id: productId,
          reference_type: 'stock_transfer',
          notes: notes ?? null,
        };

        const outTxn = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('stock_transactions').insert({
              ...txnBase,
              warehouse_id: fromWarehouseId,
              transaction_type: 'out',
              quantity,
            }).select('id').single();
            return result as { data: { id: string } | null; error: unknown };
          },
          { action: 'stock_transfer_out', resource: 'stock_transactions', userId, organizationId },
        ) as { id: string };

        const { error: inErr } = await db.from('stock_transactions').insert({
          ...txnBase,
          warehouse_id: toWarehouseId,
          transaction_type: 'in',
          quantity,
        });
        if (inErr) {
          await db.from('stock_transactions').delete().eq('id', outTxn.id).eq('organization_id', organizationId);
          throw new Error(inErr.message);
        }

        return { success: true, productId, fromWarehouseId, toWarehouseId, quantity };
      },
    }),
  };
}
