// src/tools/schema-tools.ts
// Schema Architect Agent tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createSchemaTools(db: SupabaseClient, organizationId: string) {
  return {
    list_active_schemas: tool({
      description: 'List active UI schemas in the registry',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from('schema_registry')
          .select('id, name, slug, description, status, version, created_at')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .order('name');
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_schema: tool({
      description: 'Get a specific UI schema by ID or slug',
      inputSchema: z.object({
        id: z.string().uuid().optional(),
        slug: z.string().optional(),
      }),
      execute: async ({ id, slug }) => {
        let query = db
          .from('schema_registry')
          .select('*')
          .eq('organization_id', organizationId);

        if (id) query = query.eq('id', id);
        else if (slug) query = query.eq('slug', slug);
        else throw new Error('Must provide id or slug');

        const { data, error } = await query.single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    preview_component_snapshot: tool({
      description: 'Preview what a schema diff would look like as a form',
      inputSchema: z.object({
        fields: z.array(z.object({
          name: z.string(),
          type: z.string(),
          widget: z.string(),
          required: z.boolean().optional(),
          label: z.string().optional(),
        })),
      }),
      execute: async ({ fields }) => ({
        preview: {
          type: 'object',
          properties: Object.fromEntries(
            fields.map((f) => [f.name, { type: f.type, title: f.label ?? f.name }])
          ),
          required: fields.filter((f) => f.required).map((f) => f.name),
        },
        fieldCount: fields.length,
      }),
    }),
  };
}
