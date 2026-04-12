// src/tools/intent-tools.ts
// Intent Agent tools — no DB access, pure NLP helpers

import { tool } from 'ai';
import { z } from 'zod';

export const intentTools = {
  clarify_ambiguity: tool({
    description: 'Generate a clarification question for the user when intent is unclear',
    inputSchema: z.object({
      ambiguousAspect: z.string().describe('What is ambiguous'),
      options: z.array(z.string()).optional().describe('Possible interpretations'),
    }),
    execute: async ({ ambiguousAspect, options }) => ({
      clarificationQuestion: `Could you clarify: ${ambiguousAspect}?`,
      options: options ?? [],
    }),
  }),

  preview_requirement_spec: tool({
    description: 'Format a requirement spec for display to the user',
    inputSchema: z.object({
      intent: z.string(),
      domain: z.string(),
      action: z.string(),
      entity: z.string(),
      parameters: z.record(z.unknown()).optional(),
    }),
    execute: async (spec) => ({
      preview: spec,
      summary: `${spec.intent} — ${spec.domain}/${spec.entity}`,
    }),
  }),
};
