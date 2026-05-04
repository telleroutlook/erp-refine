// src/agents/execution-agent.ts
// Execution Agent — calls business tools after BFF validation + human authorization
// Never generates UI or modifies Schema

import { generateText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseAgent, type AgentContext } from './base-agent';
import type { Env } from '../types/env';
import type { ToolSet } from 'ai';
import { evaluatePolicy } from '../policy/policy-engine';
import { TOOL_REGISTRY_META } from '../tools/tool-registry';
import type { AgentStrategy } from '../orchestrator/intent-router';
import { executeWithRecovery } from '../lib/recovery';
import { withKeyRotation, getApiKeys } from '../runtime/key-rotator';

export interface ExecutionRequest {
  action: string;
  domain: string;
  parameters: Record<string, unknown>;
  confirmed?: boolean;
  approved?: boolean;
  strategy?: AgentStrategy;
  historyContext?: string;
}

export interface ExecutionResponse {
  success: boolean;
  result?: unknown;
  requiresConfirmation?: boolean;
  requiresApproval?: boolean;
  confirmationPrompt?: string;
  policyDecision?: string;
  error?: string;
}

const BASE_SYSTEM_PROMPT = `You are an ERP Execution Agent. Your job is to fulfill the user's request by calling the available tools.

CRITICAL RULES:
1. Call tools only when the action maps to a concrete ERP operation (querying data, creating records, etc.). If the request is a general question about identity or capabilities, respond directly without calling any tool.
2. If the exact tool name doesn't match the action, find the closest matching tool and call it.
3. Map intents to tools: "analyze_sales" or "sales_analysis" → call get_sales_summary; "analyze_procurement" → get_procurement_summary; "inventory_valuation" → get_inventory_valuation.
4. For query/analysis requests, always call the most relevant tool immediately.
5. Never say "I don't see a tool named X" — instead pick the best matching tool and call it.
6. Return results in Chinese when the user's message is in Chinese.`;

export class ExecutionAgent extends BaseAgent {
  get name() { return 'execution-agent'; }

  async execute_request(
    request: ExecutionRequest,
    ctx: AgentContext,
    env: Env,
    tools: ToolSet
  ): Promise<ExecutionResponse> {
    // Policy check first
    const policyResult = evaluatePolicy({
      action: request.action,
      domain: request.domain,
      userId: ctx.userId,
      role: ctx.role,
      organizationId: ctx.organizationId,
      confirmed: request.confirmed,
      approved: request.approved,
    });

    if (policyResult.decision === 'deny') {
      return {
        success: false,
        error: policyResult.reason,
        policyDecision: policyResult.decision,
      };
    }

    if (policyResult.decision === 'require_confirmation') {
      return {
        success: false,
        requiresConfirmation: true,
        confirmationPrompt: `Please confirm: ${policyResult.reason}`,
        policyDecision: policyResult.decision,
      };
    }

    if (policyResult.decision === 'require_approval') {
      return {
        success: false,
        requiresApproval: true,
        confirmationPrompt: `This action requires formal approval: ${policyResult.reason}`,
        policyDecision: policyResult.decision,
      };
    }

    // Policy allows — execute
    // Filter tools: only provide the target action's tool + read-only (level 0/1) tools
    const actionMeta = TOOL_REGISTRY_META.find(m => m.name === request.action);
    const allowedToolNames = new Set(
      TOOL_REGISTRY_META
        .filter(m => m.level <= 1 || m.name === request.action)
        .map(m => m.name)
    );
    const filteredTools: ToolSet = {};
    for (const [name, t] of Object.entries(tools)) {
      if (allowedToolNames.has(name)) filteredTools[name] = t;
    }

    // SECURITY: Prevent LLM from self-confirming D2+ writes.
    // Override `confirmed` parameter in tool calls to match request-level state.
    const effectiveTools: ToolSet = {};
    for (const [name, tool] of Object.entries(filteredTools)) {
      const meta = TOOL_REGISTRY_META.find(m => m.name === name);
      if (meta && meta.level >= 2 && tool && typeof tool === 'object' && 'execute' in tool) {
        const originalExecute = (tool as any).execute;
        effectiveTools[name] = {
          ...tool,
          execute: (args: any, options: any) => {
            if (args && typeof args === 'object') {
              args.confirmed = request.confirmed ?? false;
            }
            return originalExecute(args, options);
          },
        } as any;
      } else {
        effectiveTools[name] = tool;
      }
    }

    const apiKeys = getApiKeys(env);

    const strategy = request.strategy;
    const systemPrompt = strategy?.promptSuffix
      ? `${BASE_SYSTEM_PROMPT}\n\n${strategy.promptSuffix}`
      : BASE_SYSTEM_PROMPT;

    const resolvedLevel = actionMeta ? `D${actionMeta.level}` : 'D0';

    const agentResult = await super.execute(async () => {
      const availableTools = Object.keys(effectiveTools).join(', ');

      const effectiveParams = request.parameters;

      const promptParts = [
        request.historyContext ? `Conversation context:\n${request.historyContext}` : null,
        `Available tools: ${availableTools}`,
        `Action requested: ${request.action}`,
        `Domain: ${request.domain}`,
        `Parameters: ${JSON.stringify(effectiveParams, null, 2)}`,
        `Organization: ${ctx.organizationId}`,
        '',
        'Call the most relevant tool now.',
      ].filter((p): p is string => p !== null);

      const prompt = promptParts.join('\n');
      const maxTokens = strategy?.maxOutputTokens ?? 3000;

      const recoveryResult = await executeWithRecovery(
        async (params) => {
          const { text } = await withKeyRotation(apiKeys, async (apiKey) => {
            const glm = createOpenAI({ apiKey, baseURL: env.AI_BASE_URL });
            return generateText({
              model: glm.chat(params.primaryModel),
              system: params.systemPrompt,
              prompt: params.prompt,
              tools: effectiveTools,
              stopWhen: stepCountIs(strategy?.stepLimit ?? 5),
              temperature: params.temperature,
              maxOutputTokens: params.maxTokens,
            });
          });
          return text;
        },
        {
          systemPrompt,
          prompt,
          maxTokens,
          temperature: strategy?.temperature ?? 0.3,
          primaryModel: env.AI_MODEL_TOOLS ?? 'GLM-5-Turbo',
          fallbackModel: env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air',
        },
        env
      );

      return { text: recoveryResult.text, toolResults: [], recoverySteps: recoveryResult.recoverySteps };
    }, ctx, undefined, resolvedLevel);

    if (!agentResult.success) {
      return { success: false, error: agentResult.error };
    }

    return { success: true, result: agentResult.data, policyDecision: 'allow' };
  }
}

export const executionAgent = new ExecutionAgent();
