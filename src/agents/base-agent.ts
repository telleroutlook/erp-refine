// src/agents/base-agent.ts
// Base agent scaffold — lifecycle: circuit-breaker → execute → audit → metrics

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

export interface AgentContext {
  sessionId: string;
  userId: string;
  organizationId: string;
  role: string;
  requestId?: string;
  traceId?: string;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: { promptTokens: number; completionTokens: number };
  durationMs: number;
  decisionId?: string;
}

const logger = createLogger('info', { module: 'base-agent' });

export abstract class BaseAgent {
  protected readonly logger = logger;

  abstract get name(): string;

  async execute<T>(
    fn: () => Promise<T>,
    ctx: AgentContext,
    db?: SupabaseClient
  ): Promise<AgentResult<T>> {
    const start = Date.now();
    const traceId = ctx.traceId ?? crypto.randomUUID();

    this.logger.info(`agent.start`, { agent: this.name, sessionId: ctx.sessionId, traceId });

    let decisionId: string | undefined;

    try {
      const data = await fn();
      const durationMs = Date.now() - start;

      this.logger.info('agent.success', { agent: this.name, sessionId: ctx.sessionId, traceId, durationMs });

      if (db) {
        decisionId = await this.recordDecision(db, ctx, traceId, 'success', undefined, durationMs);
      }

      return { success: true, data, durationMs, decisionId };

    } catch (err) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);

      this.logger.error('agent.error', { agent: this.name, sessionId: ctx.sessionId, traceId, error, durationMs });

      if (db) {
        decisionId = await this.recordDecision(db, ctx, traceId, 'error', error, durationMs);
      }

      return { success: false, error, durationMs, decisionId };
    }
  }

  private async recordDecision(
    db: SupabaseClient,
    ctx: AgentContext,
    traceId: string,
    status: 'success' | 'error',
    error: string | undefined,
    durationMs: number
  ): Promise<string | undefined> {
    try {
      const { data } = await db.from('agent_decisions').insert({
        organization_id: ctx.organizationId,
        session_id: ctx.sessionId,
        agent_id: this.name,
        risk_level: 'D0',
        execution_status: status === 'success' ? 'success' : 'failed',
        error_message: error ?? null,
        reasoning_summary: { traceId, userId: ctx.userId, durationMs },
      }).select('id').single();
      return data?.id;
    } catch (e) {
      this.logger.warn('Failed to record agent decision', e);
      return undefined;
    }
  }
}
