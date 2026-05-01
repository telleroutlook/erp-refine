// src/orchestrator/orchestrator.ts
// Three-Agent Orchestrator — coordinates Intent → Schema/Execution pipeline

import type { SupabaseClient } from '@supabase/supabase-js';
import { intentAgent } from '../agents/intent-agent';
import { schemaArchitectAgent } from '../agents/schema-architect-agent';
import { executionAgent } from '../agents/execution-agent';
import { routeIntent } from './intent-router';
import type { AgentContext } from '../agents/base-agent';
import type { Env } from '../types/env';
import type { ToolSet } from 'ai';
import { TraceContext } from '../lib/trace';

export interface OrchestratorRequest {
  message: string;
  sessionId: string;
  ctx: AgentContext;
  historyContext?: string;
  executionTools?: ToolSet;
  executionParams?: {
    confirmed?: boolean;
    approved?: boolean;
  };
  waitUntil?: (p: Promise<unknown>) => void;
}

export interface OrchestratorResponse {
  pipeline: string;
  intent?: unknown;
  schemaOutput?: unknown;
  executionResult?: unknown;
  requiresConfirmation?: boolean;
  requiresApproval?: boolean;
  confirmationPrompt?: string;
  error?: string;
  traceId?: string;
}

export class Orchestrator {
  async handle(
    req: OrchestratorRequest,
    env: Env,
    db?: SupabaseClient
  ): Promise<OrchestratorResponse> {
    const { message, ctx, historyContext, executionTools = {}, executionParams = {}, waitUntil } = req;

    const trace = new TraceContext(ctx.userId, ctx.organizationId, ctx.sessionId, message);
    let success = false;

    try {
      // Step 1: Parse intent (pass recent history lines for follow-up detection)
      const recentContext = historyContext
        ? historyContext.split('\n').slice(-6).join('\n')
        : undefined;

      let spec;
      try {
        spec = await trace.phase('intent', () =>
          intentAgent.parseIntent(message, ctx, env, recentContext)
        );
      } catch (err) {
        return { pipeline: 'error', error: `Intent parsing failed: ${err instanceof Error ? err.message : String(err)}`, traceId: trace.traceId };
      }

      if (spec.clarificationNeeded) {
        return {
          pipeline: 'clarification',
          intent: spec,
          confirmationPrompt: spec.clarificationQuestion,
          traceId: trace.traceId,
        };
      }

      // Meta queries (identity, capabilities) — respond directly, no tools needed
      if (spec.domain === 'meta') {
        success = true;
        return {
          pipeline: 'meta',
          intent: spec,
          executionResult: {
            success: true,
            result: '我是 ERP AI 助手，基于大语言模型构建，帮助您处理采购、销售、库存、财务、质量、制造等企业业务。有什么可以帮您？',
          },
          traceId: trace.traceId,
        };
      }

      // Step 2: Route with strategy
      const routing = routeIntent(spec);
      const { strategy } = routing;
      trace.setStrategy(strategy.name);

      if (routing.pipeline === 'query') {
        const result = await trace.phase('execution', () =>
          executionAgent.execute_request(
            {
              action: spec.action,
              domain: spec.domain,
              parameters: spec.parameters ?? {},
              confirmed: false,
              strategy,
              historyContext,
            },
            ctx,
            env,
            executionTools
          )
        );
        success = result.success;
        return { pipeline: 'query', intent: spec, executionResult: result, traceId: trace.traceId };
      }

      if (routing.pipeline === 'schema-generation') {
        try {
          const schemaOutput = await trace.phase('schema', () =>
            schemaArchitectAgent.generateSchemaDiff(spec, ctx, env)
          );
          success = true;
          return { pipeline: 'schema-generation', intent: spec, schemaOutput, traceId: trace.traceId };
        } catch (err) {
          return { pipeline: 'error', intent: spec, error: `Schema generation failed: ${err instanceof Error ? err.message : String(err)}`, traceId: trace.traceId };
        }
      }

      // Execution pipeline
      const result = await trace.phase('execution', () =>
        executionAgent.execute_request(
          {
            action: spec.action,
            domain: spec.domain,
            parameters: spec.parameters ?? {},
            confirmed: executionParams.confirmed,
            approved: executionParams.approved,
            strategy,
            historyContext,
          },
          ctx,
          env,
          executionTools
        )
      );

      success = result.success;
      return {
        pipeline: 'execution',
        intent: spec,
        executionResult: result,
        requiresConfirmation: result.requiresConfirmation,
        requiresApproval: result.requiresApproval,
        confirmationPrompt: result.confirmationPrompt,
        traceId: trace.traceId,
      };
    } finally {
      if (db) {
        const flush = trace.flush(db, success).catch(() => {});
        if (waitUntil) waitUntil(flush);
      }
    }
  }
}

export const orchestrator = new Orchestrator();
