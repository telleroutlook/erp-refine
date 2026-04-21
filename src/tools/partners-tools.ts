// src/tools/partners-tools.ts
// Partner detail tools (supplier & customer enriched views)

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createPartnersTools(db: SupabaseClient, organizationId: string) {
  return {
    get_supplier: tool({
      description: 'Get supplier detail including contacts, sites, and bank accounts',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('suppliers')
          .select(`
            *,
            sites:supplier_sites(id,site_name,site_code,address,city,country,is_default),
            bank_accounts:supplier_bank_accounts(id,bank_name,account_number,account_name,currency,is_default),
            contacts:supplier_contacts(id,contact_name,title,email,phone,is_primary)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    get_customer: tool({
      description: 'Get customer detail including addresses and bank accounts',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('customers')
          .select(`
            *,
            addresses:customer_addresses(id,address_type,address_line1,city,country,is_default),
            bank_accounts:customer_bank_accounts(id,bank_name,account_number,account_name,currency,is_default)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),
  };
}
