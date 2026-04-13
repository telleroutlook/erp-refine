// src/agents/execution-agent.ts
// Execution Agent — calls business tools after BFF validation + human authorization
// Never generates UI or modifies Schema

import { generateText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseAgent, type AgentContext } from './base-agent';
import type { Env } from '../types/env';
import type { ToolSet } from 'ai';
import { evaluatePolicy } from '../policy/policy-engine';

export interface ExecutionRequest {
  action: string;
  domain: string;
  parameters: Record<string, unknown>;
  confirmed?: boolean;
  approved?: boolean;
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

const SYSTEM_PROMPT = `You are an ERP Execution Agent. Your job is to fulfill the user's request by calling the available tools.

CRITICAL RULES:
1. You MUST call at least one tool to fulfill the request. Never just describe what tools exist.
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
    const glm = createOpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL,
    });

    const agentResult = await super.execute(async () => {
      const availableTools = Object.keys(tools).join(', ');
      const { text, toolResults } = await generateText({
        model: glm.chat(env.AI_MODEL_TOOLS ?? 'GLM-5-Turbo'),
        system: SYSTEM_PROMPT,
        prompt: `Available tools: ${availableTools}\n\nAction requested: ${request.action}\nDomain: ${request.domain}\nParameters: ${JSON.stringify(request.parameters, null, 2)}\nOrganization: ${ctx.organizationId}\n\nCall the most relevant tool now.`,
        tools,
        stopWhen: stepCountIs(5),
      });
      return { text, toolResults };
    }, ctx);

    if (!agentResult.success) {
      return { success: false, error: agentResult.error };
    }

    return { success: true, result: agentResult.data, policyDecision: 'allow' };
  }
}

export const executionAgent = new ExecutionAgent();
