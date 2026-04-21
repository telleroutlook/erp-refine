// src/queues/event-consumer.ts
// Cloudflare Queues consumer — handles async ERP events and AI background tasks

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../types/env';
import { createServiceClient } from '../utils/supabase';
import { createLogger } from '../utils/logger';
import type { Message } from '../do/chat-agent-do';

const logger = createLogger('info', { module: 'event-consumer' });

export interface ERPEvent {
  type: string;
  organizationId: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SummarizeSessionJob {
  type: 'summarize_session';
  sessionId: string;
  userId: string;
  messageCount: number;
  recentMessages: Message[];
}

type QueueMessage = ERPEvent | SummarizeSessionJob;

export async function handleQueueBatch(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
  const db = createServiceClient(env);

  for (const msg of batch.messages) {
    const body = msg.body;

    if (body.type === 'summarize_session') {
      const job = body as SummarizeSessionJob;
      try {
        await handleSummarizeSession(job, env);
        msg.ack();
      } catch (err) {
        logger.error('summarize.failed', { sessionId: job.sessionId, error: err instanceof Error ? err.message : String(err) });
        msg.retry();
      }
      continue;
    }

    // ERP domain events
    const event = body as ERPEvent;
    logger.info('event.received', { type: event.type, resourceType: event.resourceType });
    try {
      await processEvent(event, db);
      msg.ack();
    } catch (err) {
      logger.error('event.failed', { type: event.type, error: err instanceof Error ? err.message : String(err) });
      msg.retry();
    }
  }
}

async function handleSummarizeSession(job: SummarizeSessionJob, env: Env): Promise<void> {
  const { sessionId, userId, recentMessages } = job;
  logger.info('summarize.start', { sessionId, userId, messageCount: recentMessages.length });

  const glm = createOpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL });

  const transcript = recentMessages
    .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n');

  const { text: summary } = await generateText({
    model: glm.chat(env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air'),
    system: '你是一个对话摘要助手。将下面的对话记录压缩为简洁的中文摘要，保留关键业务信息（查询内容、操作结果、重要数字、决策）。摘要不超过300字。',
    prompt: transcript,
    maxOutputTokens: 400,
    temperature: 0,
  });

  const doKey = `${userId}:${sessionId}`;
  const doId = env.CHAT_DO.idFromName(doKey);
  const stub = env.CHAT_DO.get(doId);
  await stub.fetch(new Request(`http://do/${doKey}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary }),
  }));

  logger.info('summarize.done', { sessionId });
}

async function processEvent(event: ERPEvent, db: ReturnType<typeof createServiceClient>): Promise<void> {
  const { error } = await db.from('business_events').insert({
    organization_id: event.organizationId,
    event_type: event.type,
    entity_type: event.resourceType,
    entity_id: event.resourceId,
    payload: event.payload,
    severity: 'info',
  });
  if (error) throw new Error(`Failed to persist event: ${error.message}`);

  switch (event.type) {
    case 'purchase_order.approved':
      logger.info('PO approved', { id: event.resourceId });
      break;
    case 'stock.low_warning':
      logger.warn('Low stock warning', { productId: event.resourceId });
      break;
    default:
      logger.debug('Unhandled event type', { type: event.type });
  }
}
