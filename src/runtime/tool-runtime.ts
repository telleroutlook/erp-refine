// src/runtime/tool-runtime.ts
// Tool execution runtime: timeout, retry, circuit breaker, metrics

import type { SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreaker } from './circuit-breaker';
import { createLogger } from '../utils/logger';

const logger = createLogger('info', { module: 'tool-runtime' });

export interface ToolExecutionOptions {
  toolName: string;
  sessionId: string;
  organizationId: string;
  userId: string;
  timeout?: number;    // ms, default 25000
  retries?: number;    // default 1
  retryDelay?: number; // ms, default 1000
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
  retries: number;
}

const breakers = new Map<string, CircuitBreaker>();

function getBreaker(toolName: string): CircuitBreaker {
  if (!breakers.has(toolName)) {
    breakers.set(toolName, new CircuitBreaker({ failureThreshold: 3, timeout: 60_000 }));
  }
  return breakers.get(toolName)!;
}

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Tool timed out after ${ms}ms`)), ms);
    fn().then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

export async function executeTool<T>(
  fn: () => Promise<T>,
  options: ToolExecutionOptions,
  db?: SupabaseClient
): Promise<ToolResult<T>> {
  const {
    toolName,
    sessionId,
    organizationId,
    userId,
    timeout = 25_000,
    retries = 1,
    retryDelay = 1_000,
  } = options;

  const breaker = getBreaker(toolName);
  const start = Date.now();
  let attempts = 0;

  while (true) {
    try {
      const data = await breaker.execute(() => withTimeout(fn, timeout));
      const durationMs = Date.now() - start;

      logger.info('tool.success', { toolName, sessionId, durationMs, attempts });
      if (db) {
        recordMetric(db, { toolName, sessionId, organizationId, userId, durationMs, success: true, attempts });
      }
      return { success: true, data, durationMs, retries: attempts };

    } catch (err) {
      attempts++;
      const error = err instanceof Error ? err.message : String(err);

      if (attempts > retries) {
        const durationMs = Date.now() - start;
        logger.error('tool.failed', { toolName, sessionId, durationMs, attempts, error });
        if (db) {
          recordMetric(db, { toolName, sessionId, organizationId, userId, durationMs, success: false, attempts, error });
        }
        return { success: false, error, durationMs, retries: attempts };
      }

      logger.warn('tool.retry', { toolName, attempt: attempts, error });
      await new Promise((r) => setTimeout(r, retryDelay * attempts));
    }
  }
}

function recordMetric(
  db: SupabaseClient,
  data: {
    toolName: string;
    sessionId: string;
    organizationId: string;
    userId: string;
    durationMs: number;
    success: boolean;
    attempts: number;
    error?: string;
  }
): void {
  db.from('tool_call_metrics').insert({
    tool_name: data.toolName,
    session_id: data.sessionId,
    organization_id: data.organizationId,
    user_id: data.userId,
    duration_ms: data.durationMs,
    success: data.success,
    retries: data.attempts - 1,
    error_message: data.error ?? null,
  }).then(({ error: e }) => {
    if (e) logger.warn('Failed to record tool metric', e);
  });
}
