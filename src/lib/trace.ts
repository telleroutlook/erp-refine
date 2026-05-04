// src/lib/trace.ts
// Unified request tracing: phase-level timing, token accounting, recovery tracking

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger';

const logger = createLogger('info', { module: 'trace' });

interface PhaseRecord {
  durationMs: number;
  error?: string;
}

export class TraceContext {
  readonly traceId: string;
  private readonly startedAt: number;
  private phases = new Map<string, PhaseRecord>();
  private inputTokens = 0;
  private outputTokens = 0;
  private recoverySteps: string[] = [];
  private modelUsed = 'unknown';
  private strategyUsed = 'general';

  constructor(
    readonly userId: string,
    readonly organizationId: string,
    readonly sessionId: string,
    readonly query: string,
  ) {
    this.traceId = crypto.randomUUID();
    this.startedAt = Date.now();
  }

  /** Wrap async work in a named phase for timing */
  async phase<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.phases.set(name, { durationMs: Date.now() - start });
      return result;
    } catch (e) {
      this.phases.set(name, { durationMs: Date.now() - start, error: String(e).slice(0, 200) });
      throw e;
    }
  }

  addTokens(input: number, output: number): void {
    this.inputTokens += input;
    this.outputTokens += output;
  }

  setModel(model: string): void { this.modelUsed = model; }
  setStrategy(strategy: string): void { this.strategyUsed = strategy; }

  addRecoveryStep(step: string): void {
    this.recoverySteps.push(step);
  }

  addRecoverySteps(steps: string[]): void {
    this.recoverySteps.push(...steps);
  }

  get totalDurationMs(): number {
    return Date.now() - this.startedAt;
  }

  /** Persist trace to agent_decisions table */
  async flush(db: SupabaseClient, success: boolean): Promise<void> {
    const phases = Object.fromEntries(this.phases.entries());
    try {
      await db.from('agent_decisions').insert({
        organization_id: this.organizationId,
        session_id: this.sessionId,
        agent_id: 'orchestrator',
        risk_level: 'D0',
        execution_status: success ? 'success' : 'failed',
        reasoning_summary: {
          traceId: this.traceId,
          userId: this.userId,
          durationMs: this.totalDurationMs,
          phases,
          inputTokens: this.inputTokens,
          outputTokens: this.outputTokens,
          model: this.modelUsed,
          strategy: this.strategyUsed,
          recoverySteps: this.recoverySteps,
          query: this.query.slice(0, 200),
        },
      });

      // Record token usage if available
      if (this.inputTokens > 0 || this.outputTokens > 0) {
        const costEstimate = (this.inputTokens * 0.003 + this.outputTokens * 0.006) / 1000;
        await db.from('token_usage').insert({
          organization_id: this.organizationId,
          session_id: this.sessionId,
          model: this.modelUsed || 'unknown',
          input_tokens: this.inputTokens,
          output_tokens: this.outputTokens,
          cost_estimate: costEstimate,
          variant: 'tools',
        });
      }
    } catch (e) {
      logger.warn('trace.flush.failed', { traceId: this.traceId, error: String(e) });
    }
  }
}
