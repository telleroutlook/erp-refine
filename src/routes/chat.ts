// src/routes/chat.ts
// Chat route — streams AI responses, routes through Orchestrator

import { Hono } from 'hono';
import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { orchestrator } from '../orchestrator/orchestrator';
import { createAuthenticatedClient } from '../utils/supabase';
import { buildToolSet } from '../tools/tool-registry';

const chat = new Hono<{ Bindings: Env }>();

chat.use('*', authMiddleware());

/** POST /api/chat — non-streaming, full orchestration */
chat.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    message: string;
    sessionId?: string;
    confirmed?: boolean;
    approved?: boolean;
  }>();

  if (!body.message?.trim()) return c.json({ error: 'Message required' }, 400);

  const sessionId = body.sessionId ?? crypto.randomUUID();
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  const tools = buildToolSet({ db, organizationId: user.organizationId });

  const ctx = {
    sessionId,
    userId: user.userId,
    organizationId: user.organizationId,
    role: user.role,
    requestId: c.get('requestId'),
  };

  const response = await orchestrator.handle(
    {
      message: body.message,
      sessionId,
      ctx,
      executionTools: tools,
      executionParams: { confirmed: body.confirmed, approved: body.approved },
    },
    c.env,
    db
  );

  return c.json({ data: response, sessionId });
});

/** POST /api/chat/stream — SSE streaming for conversational AI */
chat.post('/stream', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ message: string; sessionId?: string }>();

  if (!body.message?.trim()) return c.json({ error: 'Message required' }, 400);

  const glm = createOpenAI({ apiKey: c.env.AI_API_KEY, baseURL: c.env.AI_BASE_URL });
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const tools = buildToolSet({ db, organizationId: user.organizationId });

  const result = streamText({
    model: glm.chat(c.env.AI_MODEL_TOOLS ?? 'GLM-5-Turbo'),
    system: `You are an ERP assistant for organization ${user.organizationId}. You have access to tools for querying ERP data. Always be helpful and concise.`,
    messages: [{ role: 'user', content: body.message }],
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toTextStreamResponse();
});

export default chat;
