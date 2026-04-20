// src/tools/lookup-tools.ts
// Generic lookup tools for dropdowns and references

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createLookupTools(db: SupabaseClient, organizationId: string) {
  return {
    lookup_by_number: tool({
      description: 'Find a business document by its number (e.g. PO-2024-001)',
      inputSchema: z.object({
        documentType: z.enum(['purchase_order','sales_order','sales_invoice','supplier_invoice','sales_shipment','purchase_receipt']),
        documentNumber: z.string(),
      }),
      execute: async ({ documentType, documentNumber }) => {
        const tableMap: Record<string, string> = {
          purchase_order: 'purchase_orders',
          sales_order: 'sales_orders',
          sales_invoice: 'sales_invoices',
          supplier_invoice: 'supplier_invoices',
          sales_shipment: 'sales_shipments',
          purchase_receipt: 'purchase_receipts',
        };
        const table = tableMap[documentType];
        if (!table) return null;

        const numberColumn: Record<string, string> = {
          purchase_orders: 'order_number',
          sales_orders: 'order_number',
          purchase_receipts: 'receipt_number',
          supplier_invoices: 'invoice_number',
          sales_shipments: 'shipment_number',
          sales_invoices: 'invoice_number',
        };

        const { data, error } = await (db.from(table) as any)
          .select('*')
          .eq('organization_id', organizationId)
          .eq(numberColumn[table] ?? 'order_number', documentNumber)
          .is('deleted_at', null)
          .limit(1);

        if (error) throw new Error(error.message);
        return data?.[0] ?? null;
      },
    }),
  };
}
