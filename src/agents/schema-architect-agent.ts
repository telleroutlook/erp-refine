// src/agents/schema-architect-agent.ts
// Schema Architect Agent — receives RequirementSpec → generates UI Schema Diff
// Only operates within component whitelist, never touches business data

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { BaseAgent, type AgentContext } from './base-agent';
import type { RequirementSpec } from './intent-agent';
import type { Env } from '../types/env';

const FieldDefSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  widget: z.string().describe('RJSF widget or Ant Design component identifier'),
  required: z.boolean().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  generated: z.string().optional().describe('Formula for computed fields'),
  readOnly: z.boolean().optional(),
});

const SchemaDiffSchema = z.object({
  addFields: z.array(FieldDefSchema).optional(),
  modifyFields: z.array(FieldDefSchema.extend({ name: z.string() })).optional(),
  removeFields: z.array(z.string()).optional(),
  layout: z.array(z.string()).optional().describe('Ordered list of field names'),
  storage: z.enum(['jsonb_dynamic_vault', 'existing_table']).default('jsonb_dynamic_vault'),
  targetTable: z.string().optional().describe('For existing_table storage'),
  riskLevel: z.enum(['low', 'medium', 'high']),
  rationale: z.string(),
});

const SchemaOutputSchema = z.object({
  schemaName: z.string(),
  schemaSlug: z.string(),
  description: z.string(),
  schemaDiff: SchemaDiffSchema,
  jsonSchema: z.record(z.unknown()).describe('Full RJSF-compatible JSON Schema'),
  uiSchema: z.record(z.unknown()).optional().describe('RJSF UI Schema overrides'),
});

export type SchemaDiff = z.infer<typeof SchemaDiffSchema>;
export type SchemaOutput = z.infer<typeof SchemaOutputSchema>;

const SYSTEM_PROMPT = `You are an ERP Schema Architect Agent. Given a requirement spec, you generate a UI Schema Diff.
Rules:
1. Only use components from the allowed whitelist: text, number, date, select, multiselect, textarea, rate, checkbox, radio, file-upload, currency, percentage
2. Output a valid RJSF-compatible JSON Schema
3. Use jsonb_dynamic_vault for new custom forms, existing_table only for modifications to known tables
4. Assess risk: low (new form fields), medium (modifying existing forms), high (financial fields, permissions)
5. Never generate schema that bypasses RLS or accesses cross-organization data`;

export class SchemaArchitectAgent extends BaseAgent {
  get name() { return 'schema-architect-agent'; }

  async generateSchemaDiff(
    spec: RequirementSpec,
    ctx: AgentContext,
    env: Env
  ): Promise<SchemaOutput> {
    const glm = createOpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL,
    });

    const result = await this.execute(async () => {
      const { object } = await generateObject({
        model: glm(env.AI_MODEL_PRIMARY ?? 'GLM-4.5-Air'),
        schema: SchemaOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: `Generate a UI Schema for this requirement:\n${JSON.stringify(spec, null, 2)}`,
      });
      return object;
    }, ctx);

    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Schema generation failed');
    }

    return result.data;
  }
}

export const schemaArchitectAgent = new SchemaArchitectAgent();
