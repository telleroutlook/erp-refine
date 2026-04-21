// src/tools/system-tools.ts
// System domain tools — workflows and document traceability

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createSystemTools(db: SupabaseClient, organizationId: string) {
  return {
    list_workflows: tool({
      description: 'Look up workflow status for business entities (approvals, state machines)',
      inputSchema: z.object({
        entityType: z.string().optional().describe('e.g. purchase_orders, sales_orders'),
        entityId: z.string().uuid().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ entityType, entityId, status, limit }) => {
        let query = db
          .from('workflows')
          .select('id, workflow_type, entity_type, entity_id, status, current_step, started_by, started_at, completed_at, created_at')
          .eq('organization_id', organizationId);

        if (entityType) query = query.eq('entity_type', entityType);
        if (entityId) query = query.eq('entity_id', entityId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_document_relations: tool({
      description: 'Trace document links between ERP objects (e.g. PO → receipt → invoice)',
      inputSchema: z.object({
        fromObjectType: z.string().optional(),
        fromObjectId: z.string().uuid().optional(),
        toObjectType: z.string().optional(),
        relationType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
      execute: async ({ fromObjectType, fromObjectId, toObjectType, relationType, limit }) => {
        let query = db
          .from('document_relations')
          .select('id, from_object_type, from_object_id, to_object_type, to_object_id, relation_type, label, created_at')
          .eq('organization_id', organizationId);

        if (fromObjectType) query = query.eq('from_object_type', fromObjectType);
        if (fromObjectId) query = query.eq('from_object_id', fromObjectId);
        if (toObjectType) query = query.eq('to_object_type', toObjectType);
        if (relationType) query = query.eq('relation_type', relationType);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
