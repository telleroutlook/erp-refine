// src/agents/intent-agent.ts
// Intent Agent — parses user natural language into a structured RequirementSpec
// Does NOT touch UI or business data

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { BaseAgent, type AgentContext } from './base-agent';
import type { Env } from '../types/env';
import { stripJsonFences } from '../utils/json-helpers';

const RequirementSpecSchema = z.object({
  intent: z.string().describe('Primary action the user wants to accomplish'),
  domain: z.enum(['procurement', 'sales', 'inventory', 'finance', 'quality', 'manufacturing', 'master-data', 'reporting', 'system', 'meta']),
  action: z.string().describe('Specific action verb, e.g. create_purchase_order, list_invoices'),
  entity: z.string().describe('Primary business entity, e.g. purchase_order, sales_invoice'),
  parameters: z.record(z.unknown()).optional().describe('Extracted parameters from the user message'),
  fieldsHint: z.array(z.string()).optional().describe('Suggested field names for UI generation'),
  confidence: z.number().min(0).max(1),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

export type RequirementSpec = z.infer<typeof RequirementSpecSchema>;

const SYSTEM_PROMPT = `You are an ERP Intent Agent. Parse user natural language into a structured JSON requirement specification.
You understand enterprise business processes: procurement (P2P), sales (O2C), inventory, finance, quality, and manufacturing.
IMPORTANT: Respond ONLY with a valid JSON object, no markdown, no explanation.

SPECIAL CASE — Meta queries: If the user is asking about the AI's identity, capabilities, or any non-ERP topic
(e.g. "你是谁", "who are you", "你能做什么", "what can you do", "介绍一下你自己"), output:
{"domain":"meta","action":"meta_identity","intent":"<user intent>","entity":"assistant","confidence":1,"clarificationNeeded":false,"parameters":{}}

Required JSON fields:
- intent: string (what user wants)
- domain: one of [procurement, sales, inventory, finance, quality, manufacturing, master-data, reporting, system, meta]
- action: string (verb like list_sales_orders, analyze_sales, create_purchase_order)
- entity: string (business entity like sales_order, purchase_order, invoice)
- confidence: number 0-1
- clarificationNeeded: boolean
- clarificationQuestion: string (only if clarificationNeeded is true)
- parameters: object (optional, extracted filters/values)`;

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
      const { text } = await generateText({
        model: glm.chat(env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air'),
        system: SYSTEM_PROMPT,
        prompt: `Parse this user request into JSON: "${message}"\n\nContext: organizationId=${ctx.organizationId}, role=${ctx.role}`,
        providerOptions: {
          openai: { response_format: { type: 'json_object' } },
        },
      });

      // Strip markdown code fences if present
      const cleaned = stripJsonFences(text);
      const parsed = JSON.parse(cleaned);
      return RequirementSpecSchema.parse(parsed);
    }, ctx);

    if (!result.success || !result.data) {
      throw new Error(result.error ?? 'Intent parsing failed');
    }

    return result.data;
  }
}

export const intentAgent = new IntentAgent();
