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
        status: z.enum(['draft','submitted','confirmed','approved','rejected','shipping','shipped','completed','cancelled']).optional(),
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

    list_sales_invoices: tool({
      description: 'List sales invoices (AR invoices)',
      inputSchema: z.object({
        status: z.enum(['draft','sent','paid','overdue','cancelled']).optional(),
        customerId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, customerId, limit }) => {
        let query = db
          .from('sales_invoices')
          .select('id, invoice_number, status, invoice_date, due_date, total_amount, currency, customer:customers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

        const { data, error } = await query.order('invoice_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_sales_returns: tool({
      description: 'List sales returns (RMA)',
      inputSchema: z.object({
        status: z.enum(['draft','approved','received','cancelled']).optional(),
        customerId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, customerId, limit }) => {
        let query = db
          .from('sales_returns')
          .select('id, return_number, status, return_date, total_amount, customer:customers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

        const { data, error } = await query.order('return_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_customer_receipts: tool({
      description: 'List customer receipts (AR payments received)',
      inputSchema: z.object({
        customerId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ customerId, limit }) => {
        let query = db
          .from('customer_receipts')
          .select('id, receipt_number, receipt_date, amount, payment_method, customer:customers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (customerId) query = query.eq('customer_id', customerId);

        const { data, error } = await query.order('receipt_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_sales_shipments: tool({
      description: 'List sales shipments (delivery orders)',
      inputSchema: z.object({
        status: z.enum(['draft','confirmed','shipped','cancelled']).optional(),
        salesOrderId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, salesOrderId, limit }) => {
        let query = db
          .from('sales_shipments')
          .select('id, shipment_number, status, shipment_date, customer:customers(id,name,code), sales_order:sales_orders(id,order_number)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (salesOrderId) query = query.eq('sales_order_id', salesOrderId);

        const { data, error } = await query.order('shipment_date', { ascending: false }).limit(limit);
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
          quantity: i.qty,
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

    submit_sales_order: tool({
      description: 'Submit a draft sales order for approval (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: so, error } = await db
          .from('sales_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !so) throw new Error('Sales order not found');
        if (so.status !== 'draft') throw new Error(`Cannot submit SO in status '${so.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to submit', id: so.id, orderNumber: so.order_number };
        }

        const { error: updateErr } = await db
          .from('sales_orders')
          .update({ status: 'submitted', submitted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: so.id, orderNumber: so.order_number, status: 'submitted' };
      },
    }),

    approve_sales_order: tool({
      description: 'Approve a submitted sales order (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: so, error } = await db
          .from('sales_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !so) throw new Error('Sales order not found');
        if (so.status !== 'submitted') throw new Error(`Cannot approve SO in status '${so.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to approve', id: so.id, orderNumber: so.order_number };
        }

        const { error: updateErr } = await db
          .from('sales_orders')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: so.id, orderNumber: so.order_number, status: 'approved' };
      },
    }),

    cancel_sales_order: tool({
      description: 'Cancel a sales order (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: so, error } = await db
          .from('sales_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !so) throw new Error('Sales order not found');
        if (!['draft', 'submitted', 'approved'].includes(so.status)) {
          throw new Error(`Cannot cancel SO in status '${so.status}'`);
        }

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to cancel', id: so.id, orderNumber: so.order_number, currentStatus: so.status };
        }

        const { error: updateErr } = await db
          .from('sales_orders')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason ?? null })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: so.id, orderNumber: so.order_number, status: 'cancelled' };
      },
    }),

    confirm_sales_shipment: tool({
      description: 'Confirm a sales shipment for stock deduction (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: shipment, error } = await db
          .from('sales_shipments')
          .select('id, shipment_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !shipment) throw new Error('Sales shipment not found');
        if (shipment.status !== 'draft') throw new Error(`Cannot confirm shipment in status '${shipment.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to confirm shipment (will deduct stock)', id: shipment.id, shipmentNumber: shipment.shipment_number };
        }

        const { error: updateErr } = await db
          .from('sales_shipments')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: null })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: shipment.id, shipmentNumber: shipment.shipment_number, status: 'confirmed' };
      },
    }),

    receive_sales_return: tool({
      description: 'Receive a sales return into inventory (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: ret, error } = await db
          .from('sales_returns')
          .select('id, return_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !ret) throw new Error('Sales return not found');
        if (ret.status !== 'approved') throw new Error(`Cannot receive return in status '${ret.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to receive return (will add stock)', id: ret.id, returnNumber: ret.return_number };
        }

        const { error: updateErr } = await db
          .from('sales_returns')
          .update({ status: 'received', received_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: ret.id, returnNumber: ret.return_number, status: 'received' };
      },
    }),

    list_shipment_tracking: tool({
      description: 'List tracking events for a sales shipment',
      inputSchema: z.object({
        shipmentId: z.string().uuid(),
      }),
      execute: async ({ shipmentId }) => {
        const { data, error } = await db
          .from('shipment_tracking_events')
          .select('id, shipment_id, event_type, location, notes, occurred_at, created_at')
          .eq('organization_id', organizationId)
          .eq('shipment_id', shipmentId)
          .order('occurred_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
