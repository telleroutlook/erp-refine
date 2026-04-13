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

export interface OrchestratorRequest {
  message: string;
  sessionId: string;
  ctx: AgentContext;
  executionTools?: ToolSet;
  executionParams?: {
    confirmed?: boolean;
    approved?: boolean;
  };
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
}

export class Orchestrator {
  async handle(
    req: OrchestratorRequest,
    env: Env,
    db?: SupabaseClient
  ): Promise<OrchestratorResponse> {
    const { message, ctx, executionTools = {}, executionParams = {} } = req;

    // Step 1: Parse intent
    let spec;
    try {
      spec = await intentAgent.parseIntent(message, ctx, env);
    } catch (err) {
      return { pipeline: 'error', error: `Intent parsing failed: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (spec.clarificationNeeded) {
      return {
        pipeline: 'clarification',
        intent: spec,
        confirmationPrompt: spec.clarificationQuestion,
      };
    }

    // Meta queries (identity, capabilities) — respond directly, no tools needed
    if (spec.domain === 'meta') {
      return {
        pipeline: 'meta',
        intent: spec,
        executionResult: {
          success: true,
          result: '我是 ERP AI 助手，基于大语言模型构建，帮助您处理采购、销售、库存、财务、质量、制造等企业业务。有什么可以帮您？',
        },
      };
    }

    // Step 2: Route
    const routing = routeIntent(spec);

    if (routing.pipeline === 'query') {
      // For queries, run execution agent with read-only tools
      const result = await executionAgent.execute_request(
        { action: spec.action, domain: spec.domain, parameters: spec.parameters ?? {}, confirmed: true },
        ctx,
        env,
        executionTools
      );
      return { pipeline: 'query', intent: spec, executionResult: result };
    }

    if (routing.pipeline === 'schema-generation') {
      try {
        const schemaOutput = await schemaArchitectAgent.generateSchemaDiff(spec, ctx, env);
        return { pipeline: 'schema-generation', intent: spec, schemaOutput };
      } catch (err) {
        return { pipeline: 'error', intent: spec, error: `Schema generation failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    }

    // Execution pipeline
    const result = await executionAgent.execute_request(
      {
        action: spec.action,
        domain: spec.domain,
        parameters: spec.parameters ?? {},
        confirmed: executionParams.confirmed,
        approved: executionParams.approved,
      },
      ctx,
      env,
      executionTools
    );

    return {
      pipeline: 'execution',
      intent: spec,
      executionResult: result,
      requiresConfirmation: result.requiresConfirmation,
      requiresApproval: result.requiresApproval,
      confirmationPrompt: result.confirmationPrompt,
    };
  }
}

export const orchestrator = new Orchestrator();
