// src/routes/chat.ts
// Chat route — streams AI responses, routes through Orchestrator with conversation history

import { Hono } from 'hono';
import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { orchestrator } from '../orchestrator/orchestrator';
import { createAuthenticatedClient } from '../utils/supabase';
import { buildToolSet } from '../tools/tool-registry';
import type { Message } from '../do/chat-agent-do';

const chat = new Hono<{ Bindings: Env }>();

chat.use('*', authMiddleware());

/** Load recent conversation history from the Durable Object */
async function loadRecentHistory(env: Env, userId: string, sessionId: string, n = 10): Promise<{ messages: Message[]; summary: string | null }> {
  try {
    const doKey = `${userId}:${sessionId}`;
    const doId = env.CHAT_DO.idFromName(doKey);
    const stub = env.CHAT_DO.get(doId);
    const res = await stub.fetch(new Request(`http://do/${doKey}/history/recent?n=${n}`));
    return await res.json<{ messages: Message[]; summary: string | null }>();
  } catch {
    return { messages: [], summary: null };
  }
}

/** Append a message to the Durable Object (fire-and-forget) */
function appendMessage(env: Env, ctx: ExecutionContext, userId: string, sessionId: string, role: 'user' | 'assistant', content: string): void {
  const doKey = `${userId}:${sessionId}`;
  const doId = env.CHAT_DO.idFromName(doKey);
  const stub = env.CHAT_DO.get(doId);
  ctx.waitUntil(
    stub.fetch(new Request(`http://do/${doKey}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content }),
    })).catch(() => {})
  );
}

/** Build a context string from recent messages for injection into prompts */
function buildHistoryContext(messages: Message[], summary: string | null): string {
  const parts: string[] = [];
  if (summary) parts.push(`--- 对话摘要 ---\n${summary}`);
  if (messages.length > 0) {
    const recent = messages
      .map((m) => `[${m.timestamp.slice(0, 16)}] ${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n');
    parts.push(`--- 最近对话记录 ---\n${recent}`);
  }
  return parts.join('\n\n');
}

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
  if (body.message.length > 4000) return c.json({ error: 'Message too long (max 4000 chars)' }, 400);

  const sessionId = body.sessionId ?? crypto.randomUUID();
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));

  // Load conversation history
  const { messages: historyMsgs, summary } = await loadRecentHistory(c.env, user.userId, sessionId);
  const historyContext = buildHistoryContext(historyMsgs, summary);

  // Persist user message (fire-and-forget)
  appendMessage(c.env, c.executionCtx, user.userId, sessionId, 'user', body.message);

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
      historyContext,
      executionTools: tools,
      executionParams: { confirmed: body.confirmed, approved: body.approved },
    },
    c.env,
    db
  );

  // Persist assistant response (fire-and-forget)
  if (response.executionResult && typeof response.executionResult === 'object') {
    const result = response.executionResult as { result?: unknown };
    if (result.result) {
      appendMessage(c.env, c.executionCtx, user.userId, sessionId, 'assistant', typeof result.result === 'string' ? result.result : JSON.stringify(result.result));
    }
  }

  return c.json({ data: response, sessionId });
});

/** POST /api/chat/stream — SSE streaming with conversation history */
chat.post('/stream', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ message: string; sessionId?: string }>();

  if (!body.message?.trim()) return c.json({ error: 'Message required' }, 400);
  if (body.message.length > 4000) return c.json({ error: 'Message too long (max 4000 chars)' }, 400);

  const sessionId = body.sessionId ?? crypto.randomUUID();
  const glm = createOpenAI({ apiKey: c.env.AI_API_KEY, baseURL: c.env.AI_BASE_URL });
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const tools = buildToolSet({ db, organizationId: user.organizationId });

  // Load recent history for context
  const { messages: historyMsgs, summary } = await loadRecentHistory(c.env, user.userId, sessionId);
  const historyContext = buildHistoryContext(historyMsgs, summary);

  const systemPrompt = [
    `You are an ERP assistant for organization ${user.organizationId}. You have access to tools for querying ERP data. Always be helpful and concise. Respond in the same language as the user's message.`,
    historyContext || null,
  ].filter(Boolean).join('\n\n');

  // Persist user message
  appendMessage(c.env, c.executionCtx, user.userId, sessionId, 'user', body.message);

  const { fullStream } = streamText({
    model: glm.chat(c.env.AI_MODEL_TOOLS ?? 'GLM-5-Turbo'),
    system: systemPrompt,
    messages: [{ role: 'user', content: body.message }],
    tools,
    stopWhen: stepCountIs(5),
  });

  const encoder = new TextEncoder();
  let assistantReply = '';

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: string, data: unknown) => {
        const line = event === 'message'
          ? `data: ${JSON.stringify(data)}\n\n`
          : `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        for await (const chunk of fullStream) {
          if (chunk.type === 'text-delta') {
            const delta = (chunk as { type: 'text-delta'; text: string }).text;
            assistantReply += delta;
            enqueue('message', { type: 'text', delta });
          } else if (chunk.type === 'tool-call') {
            const tc = chunk as { type: 'tool-call'; toolName: string; toolCallId: string };
            enqueue('tool', { type: 'tool_start', name: tc.toolName, callId: tc.toolCallId });
          } else if (chunk.type === 'tool-result') {
            const tr = chunk as { type: 'tool-result'; toolName: string; toolCallId: string };
            enqueue('tool', { type: 'tool_end', name: tr.toolName, callId: tr.toolCallId });
          } else if (chunk.type === 'start-step') {
            enqueue('step', { type: 'step_start' });
          } else if (chunk.type === 'finish-step') {
            enqueue('step', { type: 'step_finish' });
          } else if (chunk.type === 'finish') {
            const f = chunk as { type: 'finish'; finishReason: string };
            enqueue('done', { type: 'done', finishReason: f.finishReason });
          }
        }

        // Persist assistant reply after stream completes
        if (assistantReply) {
          appendMessage(c.env, c.executionCtx, user.userId, sessionId, 'assistant', assistantReply);
        }
      } catch (err) {
        enqueue('error', { type: 'error', message: 'An error occurred processing your request' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

export default chat;
