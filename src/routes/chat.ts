// src/routes/chat.ts
// Chat route — streams AI responses, routes through Orchestrator with conversation history

import { Hono } from 'hono';
import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { orchestrator } from '../orchestrator/orchestrator';
import { createAuthenticatedClient, createServiceClient } from '../utils/supabase';
import { buildToolSet, TOOL_REGISTRY_META } from '../tools/tool-registry';
import { evaluatePolicy } from '../policy/policy-engine';
import type { Message } from '../do/chat-agent-do';
import { estimateTokens, classifyComplexity, allocateBudget, truncateToTokenBudget } from '../lib/context/budget';
import { saveDraft, buildDraftSummary, inferActionType, inferResourceType } from '../utils/draft-helpers';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  const tools = buildToolSet({ db, organizationId: user.organizationId, userId: user.userId, waitUntil: (p) => c.executionCtx.waitUntil(p as Promise<unknown>) });

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
      executionParams: { confirmed: body.confirmed },
      waitUntil: (p) => c.executionCtx.waitUntil(p),
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

/**
 * Wrap each tool in the ToolSet with a policy pre-check so write tools
 * (D2/D3) cannot be invoked from the streaming endpoint without policy approval.
 * Read-only tools (level 0/1) pass through immediately.
 * D2 tools: execute dry-run → save as draft → return draft card data.
 * All tools: record execution metrics to tool_call_metrics.
 */
function wrapToolsWithPolicy(
  tools: ReturnType<typeof buildToolSet>,
  user: { userId: string; role: string; organizationId: string },
  opts: { db: SupabaseClient; svcDb: SupabaseClient; sessionId: string; requestConfirmed?: boolean; waitUntil?: (p: Promise<unknown>) => void },
): ReturnType<typeof buildToolSet> {
  const wrapped: ReturnType<typeof buildToolSet> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    const meta = TOOL_REGISTRY_META.find((m) => m.name === name);
    const level = meta?.level ?? 0;
    const domain = meta?.domain ?? 'system';

    const originalExecute = (toolDef as unknown as { execute: (args: unknown, opts: unknown) => Promise<unknown> }).execute;

    const wrappedExecute = async (args: Record<string, unknown>, execOpts: unknown) => {
      const start = Date.now();
      let success = true;
      let errorMsg: string | undefined;
      try {
        if (level >= 2) {
          const policy = evaluatePolicy({
            action: name,
            domain,
            userId: user.userId,
            role: user.role,
            organizationId: user.organizationId,
            confirmed: opts.requestConfirmed,
          });
          if (policy.decision === 'deny') {
            throw new Error(`Policy denied: ${policy.reason}`);
          }
          if (policy.decision === 'require_confirmation') {
            const previewResult = await originalExecute({ ...args, confirmed: false }, execOpts);
            const previewObj = (previewResult && typeof previewResult === 'object') ? previewResult as Record<string, unknown> : {};
            const actionType = inferActionType(name);
            const resourceType = inferResourceType(name);
            const summary = buildDraftSummary(name, previewObj, args);
            const draft = await saveDraft({
              db: opts.db,
              organizationId: user.organizationId,
              userId: user.userId,
              sessionId: opts.sessionId,
              toolName: name,
              toolArgs: args,
              actionType,
              resourceType,
              targetId: (args.id as string) ?? undefined,
              content: previewObj,
              originalContent: previewObj.original ? previewObj.original as Record<string, unknown> : undefined,
              summary,
            });
            return { ...previewObj, draft_id: draft.id, _draft_card: draft.summary, _draft_action_type: draft.action_type, _draft_resource_type: draft.resource_type };
          }
          if (policy.decision === 'require_approval') {
            return { requiresApproval: true, toolName: name, message: `Approval required: ${policy.reason}. This action requires formal approval and cannot be self-approved.` };
          }
        }
        return await originalExecute(args, execOpts);
      } catch (err) {
        success = false;
        errorMsg = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const durationMs = Date.now() - start;
        const metricPromise = Promise.resolve(opts.svcDb.from('tool_call_metrics').insert({
          organization_id: user.organizationId,
          tool_name: name,
          session_id: opts.sessionId,
          duration_ms: durationMs,
          success,
          error_message: errorMsg ?? null,
          cache_hit: false,
        })).then(() => {});
        if (opts.waitUntil) opts.waitUntil(metricPromise);
      }
    };

    wrapped[name] = { ...toolDef, execute: wrappedExecute } as typeof toolDef;
  }
  return wrapped;
}

/** POST /api/chat/stream — SSE streaming with conversation history */
chat.post('/stream', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ message: string; sessionId?: string; confirmed?: boolean }>();

  if (!body.message?.trim()) return c.json({ error: 'Message required' }, 400);
  if (body.message.length > 4000) return c.json({ error: 'Message too long (max 4000 chars)' }, 400);

  const sessionId = body.sessionId ?? crypto.randomUUID();
  const glm = createOpenAI({ apiKey: c.env.AI_API_KEY, baseURL: c.env.AI_BASE_URL });
  const db = createAuthenticatedClient(c.env, c.req.header('Authorization')!.slice(7));
  const svcDb = createServiceClient(c.env);
  const waitUntil = (p: Promise<unknown>) => c.executionCtx.waitUntil(p);
  const rawTools = buildToolSet({ db, organizationId: user.organizationId, userId: user.userId, waitUntil: (p) => c.executionCtx.waitUntil(p as Promise<unknown>) });
  const tools = wrapToolsWithPolicy(rawTools, user, { db, svcDb, sessionId, requestConfirmed: body.confirmed, waitUntil });
  const { messages: historyMsgs, summary } = await loadRecentHistory(c.env, user.userId, sessionId);
  const historyContext = buildHistoryContext(historyMsgs, summary);

  const modelName = c.env.AI_MODEL_TOOLS ?? 'GLM-5-Turbo';
  const systemPrompt = `You are an ERP assistant for organization ${user.organizationId}. You have access to tools for querying ERP data. Always be helpful and concise. Respond in the same language as the user's message.`;

  // Lookup employee ID for session FK (fast single-row query)
  const { data: empRow } = await svcDb.from('employees').select('id').eq('user_id', user.userId).eq('organization_id', user.organizationId).maybeSingle();

  // Record session start (must be awaited so tool_call_metrics FK is satisfied)
  const sessionStartTime = new Date().toISOString();
  await svcDb.from('agent_sessions').insert({
    id: sessionId,
    organization_id: user.organizationId,
    session_type: 'chat',
    agent_id: 'stream-agent',
    user_id: empRow?.id ?? null,
    context: { topic: body.message.slice(0, 100) },
    status: 'active',
    started_at: sessionStartTime,
    message_count: 1,
  });

  // Build messages array with history as prior turns (not in system prompt)
  const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (historyMsgs.length > 0) {
    for (const m of historyMsgs) {
      historyMessages.push({ role: m.role, content: m.content });
    }
  }
  historyMessages.push({ role: 'user', content: body.message });

  // ─── Token budget: cap history to prevent context overflow ─────────────────
  const complexity = classifyComplexity(body.message, historyMsgs.length > 0);
  const budget = allocateBudget(complexity, ['system_prompt', 'recent_messages', 'tool_descriptions']);
  const messageBudget = budget.layers.get('recent_messages') ?? 12_000;

  let compactedMessages = historyMessages;
  let budgetFreed = 0;
  const budgetStages: string[] = [];

  const totalHistoryTokens = historyMessages.slice(0, -1)
    .reduce((sum, m) => sum + estimateTokens(m.content), 0);

  if (totalHistoryTokens > messageBudget) {
    const currentMsg = historyMessages[historyMessages.length - 1];
    let working = historyMessages.slice(0, -1);

    // Stage 1: cap each message to 800 tokens
    const CAP = 800;
    working = working.map(m => {
      const tokens = estimateTokens(m.content);
      if (tokens > CAP) {
        const { text } = truncateToTokenBudget(m.content, CAP);
        budgetFreed += tokens - estimateTokens(text);
        return { ...m, content: text };
      }
      return m;
    });
    if (budgetFreed > 0) budgetStages.push('budgetCap');

    // Stage 2: remove oldest 20% if still over budget (keep at least 4)
    const afterCapTokens = working.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    if (afterCapTokens > messageBudget && working.length > 4) {
      const toRemove = Math.max(1, Math.floor(working.length * 0.2));
      const removedTokens = working.slice(0, toRemove)
        .reduce((sum, m) => sum + estimateTokens(m.content), 0);
      working = working.slice(toRemove);
      budgetFreed += removedTokens;
      budgetStages.push('snipOldest');
    }

    compactedMessages = [...working, currentMsg!];
  }

  // Persist user message
  appendMessage(c.env, c.executionCtx, user.userId, sessionId, 'user', body.message);

  const streamResult = streamText({
    model: glm.chat(modelName),
    system: systemPrompt,
    messages: compactedMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  const encoder = new TextEncoder();
  let assistantReply = '';
  let messageCount = 1;

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: string, data: unknown) => {
        const line = event === 'message'
          ? `data: ${JSON.stringify(data)}\n\n`
          : `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        for await (const chunk of streamResult.fullStream) {
          if (chunk.type === 'text-delta') {
            const delta = (chunk as { type: 'text-delta'; text: string }).text;
            assistantReply += delta;
            enqueue('message', { type: 'text', delta });
          } else if (chunk.type === 'tool-call') {
            const tc = chunk as { type: 'tool-call'; toolName: string; toolCallId: string };
            enqueue('tool', { type: 'tool_start', name: tc.toolName, callId: tc.toolCallId });
          } else if (chunk.type === 'tool-result') {
            const tr = chunk as { type: 'tool-result'; toolName: string; toolCallId: string; output?: unknown };
            enqueue('tool', { type: 'tool_end', name: tr.toolName, callId: tr.toolCallId });
            if (tr.output && typeof tr.output === 'object') {
              const toolResult = tr.output as Record<string, unknown>;
              if (toolResult._draft_card && toolResult.draft_id) {
                enqueue('draft', {
                  type: 'draft_card',
                  draft_id: toolResult.draft_id,
                  action_type: toolResult._draft_action_type ?? 'create',
                  resource_type: toolResult._draft_resource_type ?? 'unknown',
                  summary: toolResult._draft_card,
                });
              }
            }
          } else if (chunk.type === 'start-step') {
            enqueue('step', { type: 'step_start' });
          } else if (chunk.type === 'finish-step') {
            messageCount++;
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
        // Record session completion + token usage (fire-and-forget)
        waitUntil(
          Promise.resolve(streamResult.usage).then((usage) => {
            const inputTokens = usage.inputTokens ?? 0;
            const outputTokens = usage.outputTokens ?? 0;
            const costEstimate = (inputTokens * 0.003 + outputTokens * 0.006) / 1000;
            return Promise.all([
              Promise.resolve(svcDb.from('agent_sessions').update({
                status: 'completed',
                ended_at: new Date().toISOString(),
                message_count: messageCount,
              }).eq('id', sessionId)).then(() => {}),
              Promise.resolve(svcDb.from('token_usage').insert({
                organization_id: user.organizationId,
                session_id: sessionId,
                model: modelName,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost_estimate: costEstimate,
                variant: 'tools',
              })).then(() => {}),
            ]);
          }).catch(() => {})
        );
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
      'X-Token-Budget-Complexity': complexity,
      'X-Token-Budget-Freed': String(budgetFreed),
      'X-Token-Budget-Stages': budgetStages.join(',') || 'none',
    },
  });
});

export default chat;
