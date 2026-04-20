// src/tools/sales-tools.ts
// Sales (O2C) domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createSalesTools(db: SupabaseClient, organizationId: string) {
  return {
    list_sales_orders: tool({
      description: 'List sales orders with optional filters',
      inputSchema: z.object({
        status: z.enum(['draft','confirmed','approved','shipping','shipped','completed','cancelled']).optional(),
        customerId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, customerId, limit }) => {
        let query = db
          .from('sales_orders')
          .select('id, order_number, status, order_date, total_amount, currency, customer:customers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_sales_order: tool({
      description: 'Get detailed sales order with line items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('sales_orders')
          .select('*, customer:customers(id,name,code,email), items:sales_order_items(*, product:products(id,name,code))')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_customers: tool({
      description: 'List active customers',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('customers')
          .select('id, name, code, email, phone')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error } = await query.order('name').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    create_sales_order: tool({
      description: 'Create a new sales order (requires D2 confirmation)',
      inputSchema: z.object({
        customerId: z.string().uuid(),
        orderDate: z.string(),
        currency: z.string().length(3).default('USD'),
        items: z.array(z.object({
          productId: z.string().uuid(),
          qty: z.number().positive(),
          unit_price: z.number().positive(),
        })),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ customerId, orderDate, currency, items, notes, confirmed }) => {
        const totalAmount = items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            customerId,
            orderDate,
            currency,
            itemCount: items.length,
            totalAmount,
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'sales_order',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');
        const orderNumber = seqData;

        const { data: so, error } = await db
          .from('sales_orders')
          .insert({
            organization_id: organizationId,
            customer_id: customerId,
            order_number: orderNumber,
            order_date: orderDate,
            currency,
            total_amount: totalAmount,
            status: 'draft',
            notes: notes ?? null,
          })
          .select('id, order_number')
          .single();

        if (error) throw new Error(error.message);

        const lineItems = items.map((i, idx) => ({
          sales_order_id: so.id,
          organization_id: organizationId,
          line_number: idx + 1,
          product_id: i.productId,
          qty: i.qty,
          unit_price: i.unit_price,
        }));

        const { error: lineErr } = await db.from('sales_order_items').insert(lineItems);
        if (lineErr) {
          await db.from('sales_orders').delete().eq('id', so.id);
          throw new Error(lineErr.message);
        }

        return { id: so.id, orderNumber: so.order_number, status: 'draft', totalAmount };
      },
    }),
  };
}
