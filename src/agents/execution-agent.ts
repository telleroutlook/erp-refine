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

const SYSTEM_PROMPT = `You are an ERP Execution Agent. You execute business operations through registered tools.
Rules:
1. Only call tools that are registered and available
2. Always verify the action has been confirmed/approved before executing writes
3. Never modify Schema or generate UI
4. Use the minimum required permissions
5. If unsure, return an error rather than guessing`;

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
      const { text, toolResults } = await generateText({
        model: glm(env.AI_MODEL_PRIMARY ?? 'GLM-4.5-Air'),
        system: SYSTEM_PROMPT,
        prompt: `Execute action: ${request.action}\nParameters: ${JSON.stringify(request.parameters, null, 2)}\nOrganization: ${ctx.organizationId}`,
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
