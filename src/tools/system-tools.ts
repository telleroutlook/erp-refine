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

    list_notifications: tool({
      description: 'List notifications for the current user or organization',
      inputSchema: z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ unreadOnly, limit }) => {
        let query = db
          .from('notifications')
          .select('id, title, body, notification_type, is_read, entity_type, entity_id, created_at')
          .eq('organization_id', organizationId);

        if (unreadOnly) query = query.eq('is_read', false);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_document_attachments: tool({
      description: 'List file attachments for a specific entity',
      inputSchema: z.object({
        entityType: z.string().describe('e.g. purchase_orders, sales_orders, contracts'),
        entityId: z.string().uuid(),
      }),
      execute: async ({ entityType, entityId }) => {
        const { data, error } = await db
          .from('document_attachments')
          .select('id, file_name, mime_type, file_size, file_path, uploaded_by, created_at')
          .eq('organization_id', organizationId)
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_approval_rules: tool({
      description: 'List approval rules configured for the organization',
      inputSchema: z.object({
        documentType: z.string().optional().describe('Filter by document_type, e.g. purchase_orders'),
        activeOnly: z.boolean().default(true),
      }),
      execute: async ({ documentType, activeOnly }) => {
        let query = db
          .from('approval_rules')
          .select('id, rule_name, document_type, min_amount, max_amount, required_roles, sequence_order, is_active, created_at')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);
        if (documentType) query = query.eq('document_type', documentType);
        if (activeOnly) query = query.eq('is_active', true);
        const { data, error } = await query.order('document_type').limit(100);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_roles: tool({
      description: 'List roles defined in the organization',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('roles')
          .select('id, name, description, is_system, created_at')
          .eq('organization_id', organizationId)
          .order('name');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_workflow_steps: tool({
      description: 'List steps of a specific workflow instance',
      inputSchema: z.object({
        workflowId: z.string().uuid(),
      }),
      execute: async ({ workflowId }) => {
        const { data, error } = await db
          .from('workflow_steps')
          .select('id, step_name, step_order, step_type, action, assignee_role, status, condition, completed_by, completed_at, created_at')
          .eq('workflow_id', workflowId)
          .order('step_order');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),
  };
}
