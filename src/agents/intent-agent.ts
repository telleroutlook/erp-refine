// src/agents/intent-agent.ts
// Intent Agent — parses user natural language into a structured RequirementSpec
// Does NOT touch UI or business data

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { BaseAgent, type AgentContext } from './base-agent';
import type { Env } from '../types/env';

const RequirementSpecSchema = z.object({
  intent: z.string().describe('Primary action the user wants to accomplish'),
  domain: z.enum(['procurement', 'sales', 'inventory', 'finance', 'quality', 'manufacturing', 'master-data', 'reporting', 'system']),
  action: z.string().describe('Specific action verb, e.g. create_purchase_order, list_invoices'),
  entity: z.string().describe('Primary business entity, e.g. purchase_order, sales_invoice'),
  parameters: z.record(z.unknown()).optional().describe('Extracted parameters from the user message'),
  fieldsHint: z.array(z.string()).optional().describe('Suggested field names for UI generation'),
  confidence: z.number().min(0).max(1),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

export type RequirementSpec = z.infer<typeof RequirementSpecSchema>;

const SYSTEM_PROMPT = `You are an ERP Intent Agent. Your sole job is to parse user natural language into a structured requirement specification.
You understand enterprise business processes: procurement (P2P), sales (O2C), inventory, finance, quality, and manufacturing.
Return a structured spec without touching any business data or UI.
Be concise and accurate. For ambiguous requests, set clarificationNeeded=true.`;

export class IntentAgent extends BaseAgent {
  get name() { return 'intent-agent'; }

  async parseIntent(
    message: string,
    ctx: AgentContext,
    env: Env
  ): Promise<RequirementSpec> {
    const glm = createOpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL,
    });

    const result = await this.execute(async () => {
      const { object } = await generateObject({
        model: glm(env.AI_MODEL_FAST ?? 'GLM-4.5-Air'),
        schema: RequirementSpecSchema,
        system: SYSTEM_PROMPT,
        prompt: `Parse this user request: "${message}"\n\nContext: organizationId=${ctx.organizationId}, role=${ctx.role}`,
      });
      return object;
    }, ctx);

    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Intent parsing failed');
    }

    return result.data;
  }
}

export const intentAgent = new IntentAgent();
