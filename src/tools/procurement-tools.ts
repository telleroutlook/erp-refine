// src/tools/procurement-tools.ts
// Procurement (P2P) domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atomicStatusTransition, executeWithAudit } from '../utils/database';
import { confirmPurchaseReceipt } from '../utils/confirm-helpers';

export function createProcurementTools(db: SupabaseClient, organizationId: string, userId: string, waitUntil?: (promise: PromiseLike<unknown>) => void) {
  return {
    list_purchase_orders: tool({
      description: 'List purchase orders with optional filters',
      inputSchema: z.object({
        status: z.enum(['draft','submitted','approved','rejected','in_transit','partially_received','received','closed','cancelled']).optional(),
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

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'purchase_order',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');
        const orderNumber = seqData;

        const po = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('purchase_orders').insert({
              organization_id: organizationId,
              supplier_id: supplierId,
              order_number: orderNumber,
              order_date: orderDate,
              currency,
              total_amount: totalAmount,
              status: 'draft',
              notes: notes ?? null,
            }).select('id, order_number').single();
            return result as { data: { id: string; order_number: string } | null; error: unknown };
          },
          { action: 'create', resource: 'purchase_orders', userId, organizationId },
          waitUntil,
        ) as { id: string; order_number: string };

        const lineItems = items.map((i, idx) => ({
          purchase_order_id: po.id,
          line_number: idx + 1,
          product_id: i.productId,
          quantity: i.qty,
          unit_price: i.unit_price,
          notes: i.notes ?? null,
        }));

        const { error: lineErr } = await db.from('purchase_order_items').insert(lineItems);
        if (lineErr) {
          await db.from('purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', po.id).eq('organization_id', organizationId);
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

        if (search) { const s = search.replace(/[%_]/g, ''); query = query.ilike('name', `%${s}%`); }

        const { data, error } = await query.order('name').limit(50);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_purchase_requisitions: tool({
      description: 'List purchase requisitions with optional status or department filter',
      inputSchema: z.object({
        status: z.enum(['draft','submitted','approved','rejected','cancelled','converted']).optional(),
        departmentId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, departmentId, limit }) => {
        let query = db
          .from('purchase_requisitions')
          .select('id, requisition_number, status, request_date, required_date, total_amount, department:departments(id,name), requester:employees!requester_id(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (departmentId) query = query.eq('department_id', departmentId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_purchase_requisition: tool({
      description: 'Get purchase requisition detail with all line items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('purchase_requisitions')
          .select(`
            *, department:departments(id,name), requester:employees!requester_id(id,name),
            lines:purchase_requisition_lines(*, product:products(id,name,code,uom))
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_rfq_headers: tool({
      description: 'List request-for-quotation (RFQ) headers',
      inputSchema: z.object({
        status: z.enum(['draft','issued','closed','cancelled']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('rfq_headers')
          .select('id, rfq_number, status, issued_at, due_date')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('issued_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_supplier_quotations: tool({
      description: 'List supplier quotations, optionally filtered by RFQ or supplier',
      inputSchema: z.object({
        rfqId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        status: z.enum(['received','evaluated','selected','rejected']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ rfqId, supplierId, status, limit }) => {
        let query = db
          .from('supplier_quotations')
          .select('id, quotation_number, status, validity_date, currency, supplier:suppliers(id,name,code), rfq:rfq_headers!rfq_id(id,rfq_number)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (rfqId) query = query.eq('rfq_id', rfqId);
        if (supplierId) query = query.eq('supplier_id', supplierId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_purchase_receipts: tool({
      description: 'List purchase receipts (goods received notes)',
      inputSchema: z.object({
        status: z.enum(['draft','confirmed','cancelled']).optional(),
        purchaseOrderId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, purchaseOrderId, limit }) => {
        let query = db
          .from('purchase_receipts')
          .select('id, receipt_number, status, receipt_date, supplier:suppliers(id,name,code), purchase_order:purchase_orders(id,order_number)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (purchaseOrderId) query = query.eq('purchase_order_id', purchaseOrderId);

        const { data, error } = await query.order('receipt_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_supplier_invoices: tool({
      description: 'List supplier invoices (AP invoices)',
      inputSchema: z.object({
        status: z.enum(['draft','received','verified','approved','paid','disputed','cancelled']).optional(),
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, supplierId, limit }) => {
        let query = db
          .from('supplier_invoices')
          .select('id, invoice_number, status, invoice_date, due_date, total_amount, currency, supplier:suppliers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

        const { data, error } = await query.order('invoice_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_advance_shipment_notices: tool({
      description: 'List advance shipment notices (ASN) from suppliers',
      inputSchema: z.object({
        status: z.enum(['open', 'received', 'cancelled']).optional(),
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, supplierId, limit }) => {
        let query = db
          .from('advance_shipment_notices')
          .select('id, asn_no, status, expected_date, supplier:suppliers(id,name,code), warehouse:warehouses(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

        const { data, error } = await query.order('expected_date', { ascending: true }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_reconciliation_statements: tool({
      description: 'List supplier reconciliation statements for AP reconciliation',
      inputSchema: z.object({
        status: z.enum(['draft', 'confirmed', 'closed', 'cancelled']).optional(),
        supplierId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, supplierId, limit }) => {
        let query = db
          .from('reconciliation_statements')
          .select('id, statement_no, status, period_start, period_end, total_amount, paid_amount, currency, supplier:suppliers(id,name,code)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

        const { data, error } = await query.order('period_end', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    create_purchase_requisition: tool({
      description: 'Create a new purchase requisition with line items (requires D2 confirmation)',
      inputSchema: z.object({
        departmentId: z.string().uuid().optional(),
        requesterId: z.string().uuid().optional(),
        requestDate: z.string().describe('ISO date string').optional(),
        requiredDate: z.string().describe('ISO date string').optional(),
        items: z.array(z.object({
          productId: z.string().uuid(),
          quantity: z.number().positive(),
          unitPrice: z.number().nonnegative().optional(),
          suggestedSupplierId: z.string().uuid().optional(),
          notes: z.string().optional(),
        })),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ departmentId, requesterId, requestDate, requiredDate, items, notes, confirmed }) => {
        const totalAmount = items.reduce((sum, i) => sum + i.quantity * (i.unitPrice ?? 0), 0);

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            departmentId,
            requestDate: requestDate ?? new Date().toISOString().slice(0, 10),
            itemCount: items.length,
            totalAmount,
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'purchase_requisition',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');

        const pr = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('purchase_requisitions').insert({
              organization_id: organizationId,
              requisition_number: seqData,
              department_id: departmentId ?? null,
              requester_id: requesterId ?? null,
              request_date: requestDate ?? new Date().toISOString().slice(0, 10),
              required_date: requiredDate ?? null,
              total_amount: totalAmount,
              status: 'draft',
              notes: notes ?? null,
            }).select('id, requisition_number').single();
            return result as { data: { id: string; requisition_number: string } | null; error: unknown };
          },
          { action: 'create', resource: 'purchase_requisitions', userId, organizationId },
          waitUntil,
        ) as { id: string; requisition_number: string };

        const lineItems = items.map((i, idx) => ({
          purchase_requisition_id: pr.id,
          line_number: idx + 1,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice ?? null,
          amount: i.unitPrice ? i.quantity * i.unitPrice : null,
          suggested_supplier_id: i.suggestedSupplierId ?? null,
          notes: i.notes ?? null,
        }));

        const { error: lineErr } = await db.from('purchase_requisition_lines').insert(lineItems);
        if (lineErr) {
          await db.from('purchase_requisitions').update({ deleted_at: new Date().toISOString() }).eq('id', pr.id).eq('organization_id', organizationId);
          throw new Error(lineErr.message);
        }

        return { id: pr.id, requisitionNumber: pr.requisition_number, status: 'draft', totalAmount, itemCount: items.length };
      },
    }),

    submit_purchase_order: tool({
      description: 'Submit a draft purchase order for approval (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: po, error } = await db
          .from('purchase_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !po) throw new Error('Purchase order not found');
        if (po.status !== 'draft') throw new Error(`Cannot submit PO in status '${po.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to submit', id: po.id, orderNumber: po.order_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_orders', id, organizationId, 'draft',
          { status: 'submitted', submitted_at: new Date().toISOString() },
          'id, order_number',
        );
        if (!updated) throw new Error('Purchase order status changed concurrently; please retry');

        return { id: po.id, orderNumber: po.order_number, status: 'submitted' };
      },
    }),

    approve_purchase_order: tool({
      description: 'Approve a submitted purchase order (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: po, error } = await db
          .from('purchase_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !po) throw new Error('Purchase order not found');
        if (po.status !== 'submitted') throw new Error(`Cannot approve PO in status '${po.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to approve', id: po.id, orderNumber: po.order_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_orders', id, organizationId, 'submitted',
          { status: 'approved', approved_at: new Date().toISOString() },
          'id, order_number',
        );
        if (!updated) throw new Error('Purchase order status changed concurrently; please retry');

        return { id: po.id, orderNumber: po.order_number, status: 'approved' };
      },
    }),

    submit_purchase_requisition: tool({
      description: 'Submit a draft purchase requisition for approval (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: pr, error } = await db
          .from('purchase_requisitions')
          .select('id, requisition_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Purchase requisition not found');
        if (pr.status !== 'draft') throw new Error(`Cannot submit PR in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to submit', id: pr.id, requisitionNumber: pr.requisition_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_requisitions', id, organizationId, 'draft',
          { status: 'submitted', submitted_at: new Date().toISOString() },
          'id, requisition_number',
        );
        if (!updated) throw new Error('Purchase requisition status changed concurrently; please retry');

        return { id: pr.id, requisitionNumber: pr.requisition_number, status: 'submitted' };
      },
    }),

    approve_purchase_requisition: tool({
      description: 'Approve a submitted purchase requisition (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        const { data: pr, error } = await db
          .from('purchase_requisitions')
          .select('id, requisition_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Purchase requisition not found');
        if (pr.status !== 'submitted') throw new Error(`Cannot approve PR in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to approve', id: pr.id, requisitionNumber: pr.requisition_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_requisitions', id, organizationId, 'submitted',
          { status: 'approved', approved_at: new Date().toISOString() },
          'id, requisition_number',
        );
        if (!updated) throw new Error('Purchase requisition status changed concurrently; please retry');

        return { id: pr.id, requisitionNumber: pr.requisition_number, status: 'approved' };
      },
    }),

    reject_purchase_order: tool({
      description: 'Reject a submitted purchase order (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: po, error } = await db
          .from('purchase_orders')
          .select('id, order_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !po) throw new Error('Purchase order not found');
        if (po.status !== 'submitted') throw new Error(`Cannot reject PO in status '${po.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to reject', id: po.id, orderNumber: po.order_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_orders', id, organizationId, 'submitted',
          { status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason ?? null },
          'id, order_number',
        );
        if (!updated) throw new Error('Purchase order status changed concurrently; please retry');

        return { id: po.id, orderNumber: po.order_number, status: 'rejected' };
      },
    }),

    reject_purchase_requisition: tool({
      description: 'Reject a submitted purchase requisition (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, reason, confirmed }) => {
        const { data: pr, error } = await db
          .from('purchase_requisitions')
          .select('id, requisition_number, status')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !pr) throw new Error('Purchase requisition not found');
        if (pr.status !== 'submitted') throw new Error(`Cannot reject PR in status '${pr.status}'`);

        if (!confirmed) {
          return { preview: true, message: 'Dry-run — set confirmed=true to reject', id: pr.id, requisitionNumber: pr.requisition_number };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'purchase_requisitions', id, organizationId, 'submitted',
          { status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason ?? null },
          'id, requisition_number',
        );
        if (!updated) throw new Error('Purchase requisition status changed concurrently; please retry');

        return { id: pr.id, requisitionNumber: pr.requisition_number, status: 'rejected' };
      },
    }),

    confirm_purchase_receipt: tool({
      description: 'Confirm a purchase receipt for stock-in (D2 — requires confirmation)',
      inputSchema: z.object({
        id: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, confirmed }) => {
        if (!confirmed) {
          const { data: receipt, error } = await db
            .from('purchase_receipts')
            .select('id, receipt_number, status')
            .eq('id', id)
            .eq('organization_id', organizationId)
            .is('deleted_at', null)
            .single();
          if (error || !receipt) throw new Error('Purchase receipt not found');
          return { preview: true, message: 'Dry-run — set confirmed=true to confirm receipt (will add stock)', id: receipt.id, receiptNumber: receipt.receipt_number };
        }

        const result = await confirmPurchaseReceipt({ db, id, organizationId, userId });
        return { id: result.id, receiptNumber: result.receiptNumber, status: result.status };
      },
    }),

    list_three_way_match_results: tool({
      description: 'List three-way match results (PO vs receipt vs invoice) for AP verification',
      inputSchema: z.object({
        matchStatus: z.string().optional().describe('e.g. matched, mismatch, partial, pending, disputed'),
        purchaseOrderId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ matchStatus, purchaseOrderId, limit }) => {
        let query = db
          .from('three_way_match_results')
          .select('id, purchase_order_id, purchase_receipt_id, supplier_invoice_id, match_status, quantity_variance, price_variance, amount_variance, matched_by, matched_at, notes, created_at')
          .eq('organization_id', organizationId);
        if (matchStatus) query = query.eq('match_status', matchStatus);
        if (purchaseOrderId) query = query.eq('purchase_order_id', purchaseOrderId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
