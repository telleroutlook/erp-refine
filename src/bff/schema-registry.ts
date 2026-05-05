// src/bff/schema-registry.ts
// Schema Registry — manages UI Schema lifecycle (draft → active → archived)

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SchemaOutput } from '../agents/schema-architect-agent';
import { scoreSchema } from './risk-scorer';
import { validateSchema } from './schema-validator';

export interface SchemaRecord {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  json_schema: Record<string, unknown>;
  ui_schema: Record<string, unknown> | null;
  status: 'draft' | 'active' | 'archived';
  version: number;
  risk_score: number;
  risk_level: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  activated_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  trace_id: string | null;
}

const SCHEMA_COLUMNS = 'id, organization_id, name, slug, description, json_schema, ui_schema, status, version, risk_score, risk_level, created_at, updated_at, expires_at, activated_at, archived_at, created_by, trace_id';

const DRAFT_TTL_HOURS = 72;

export class SchemaRegistry {
  constructor(private readonly db: SupabaseClient, private readonly organizationId: string) {}

  /** Save a generated schema as draft */
  async saveDraft(
    output: SchemaOutput,
    userId: string,
    traceId?: string
  ): Promise<SchemaRecord> {
    // Validate
    const validation = validateSchema(
      output.jsonSchema,
      output.uiSchema as Record<string, unknown> | undefined
    );
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors.join('; ')}`);
    }

    // Score risk
    const riskScore = scoreSchema(output);

    const expiresAt = new Date(Date.now() + DRAFT_TTL_HOURS * 3600_000).toISOString();

    const { data, error } = await this.db
      .from('schema_registry')
      .insert({
        organization_id: this.organizationId,
        name: output.schemaName,
        slug: output.schemaSlug,
        description: output.description,
        json_schema: output.jsonSchema,
        ui_schema: output.uiSchema ?? null,
        status: 'draft',
        version: 1,
        risk_score: riskScore.score,
        risk_level: riskScore.level,
        created_by: userId,
        expires_at: expiresAt,
        trace_id: traceId ?? null,
      })
      .select(SCHEMA_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return data as SchemaRecord;
  }

  /** Activate a draft schema */
  async activate(schemaId: string, _userId: string): Promise<SchemaRecord> {
    const existing = await this.get(schemaId);
    if (!existing) throw new Error('Schema not found');
    if (existing.status !== 'draft') throw new Error('Only draft schemas can be activated');
    if (existing.risk_level === 'high') {
      throw new Error('High-risk schemas require additional approval before activation');
    }

    const { data, error } = await this.db
      .from('schema_registry')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        expires_at: null,
      })
      .eq('id', schemaId)
      .eq('organization_id', this.organizationId)
      .eq('status', 'draft')
      .select(SCHEMA_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Schema not found or not in draft state');
    return data as SchemaRecord;
  }

  /** Archive an active schema */
  async archive(schemaId: string): Promise<void> {
    const { error } = await this.db
      .from('schema_registry')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
      })
      .eq('id', schemaId)
      .eq('organization_id', this.organizationId)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
  }

  /** Get schema by ID */
  async get(schemaId: string): Promise<SchemaRecord | null> {
    const { data, error } = await this.db
      .from('schema_registry')
      .select(SCHEMA_COLUMNS)
      .eq('id', schemaId)
      .eq('organization_id', this.organizationId)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data as SchemaRecord;
  }

  /** List schemas by status */
  async list(status?: 'draft' | 'active' | 'archived'): Promise<SchemaRecord[]> {
    let query = this.db
      .from('schema_registry')
      .select('id, name, slug, description, status, version, risk_score, created_at')
      .eq('organization_id', this.organizationId);

    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as SchemaRecord[];
  }
}
