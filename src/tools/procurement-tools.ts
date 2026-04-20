// src/tools/procurement-tools.ts
// Procurement (P2P) domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createProcurementTools(db: SupabaseClient, organizationId: string) {
  return {
    list_purchase_orders: tool({
      description: 'List purchase orders with optional filters',
      inputSchema: z.object({
        status: z.enum(['draft','submitted','approved','partially_received','received','invoiced','closed','cancelled']).optional(),
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, supplierId, limit }) => {
        let query = db
          .from('purchase_orders')
          .select('id, order_number, status, order_date, total_amount, currency, supplier:suppliers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_purchase_order: tool({
      description: 'Get detailed purchase order with line items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('purchase_orders')
          .select(`
            *, supplier:suppliers(id,name,code,contact_email),
            items:purchase_order_items(*, product:products(id,name,code,uom))
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    create_purchase_order: tool({
      description: 'Create a new purchase order (requires D2 confirmation)',
      inputSchema: z.object({
        supplierId: z.string().uuid(),
        orderDate: z.string().describe('ISO date string'),
        currency: z.string().length(3).default('USD'),
        items: z.array(z.object({
          productId: z.string().uuid(),
          qty: z.number().positive(),
          unit_price: z.number().positive(),
          notes: z.string().optional(),
        })),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ supplierId, orderDate, currency, items, notes, confirmed }) => {
        const totalAmount = items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            supplierId,
            orderDate,
            currency,
            itemCount: items.length,
            totalAmount,
          };
        }

        // Generate order number
        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'purchase_order',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');
        const orderNumber = seqData;

        const { data: po, error: poErr } = await db
          .from('purchase_orders')
          .insert({
            organization_id: organizationId,
            supplier_id: supplierId,
            order_number: orderNumber,
            order_date: orderDate,
            currency,
            total_amount: totalAmount,
            status: 'draft',
            notes: notes ?? null,
          })
          .select('id, order_number')
          .single();

        if (poErr) throw new Error(poErr.message);

        const lineItems = items.map((i, idx) => ({
          purchase_order_id: po.id,
          organization_id: organizationId,
          line_no: idx + 1,
          product_id: i.productId,
          quantity: i.qty,
          unit_price: i.unit_price,
          notes: i.notes ?? null,
        }));

        const { error: lineErr } = await db.from('purchase_order_items').insert(lineItems);
        if (lineErr) {
          await db.from('purchase_orders').delete().eq('id', po.id);
          throw new Error(lineErr.message);
        }

        return { id: po.id, orderNumber: po.order_number, status: 'draft', totalAmount };
      },
    }),

    list_suppliers: tool({
      description: 'List active suppliers',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('suppliers')
          .select('id, name, code, contact_email, contact_phone')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error } = await query.order('name').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
