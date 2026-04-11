// src/queues/event-consumer.ts
// Cloudflare Queues consumer — handles async ERP events

import type { Env } from '../types/env';
import { createServiceClient } from '../utils/supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('info', { module: 'event-consumer' });

export interface ERPEvent {
  type: string;
  organizationId: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export async function handleQueueBatch(batch: MessageBatch<ERPEvent>, env: Env): Promise<void> {
  const db = createServiceClient(env);

  for (const msg of batch.messages) {
    const event = msg.body;
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

async function processEvent(event: ERPEvent, db: ReturnType<typeof createServiceClient>): Promise<void> {
  // Record to business_events for audit trail
  await db.from('business_events').insert({
    organization_id: event.organizationId,
    event_type: event.type,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    payload: event.payload,
    created_at: event.timestamp,
  });

  // Domain-specific event handling
  switch (event.type) {
    case 'purchase_order.approved':
      // Could trigger email notification, create tasks, etc.
      logger.info('PO approved', { id: event.resourceId });
      break;
    case 'stock.low_warning':
      logger.warn('Low stock warning', { productId: event.resourceId });
      break;
    default:
      logger.debug('Unhandled event type', { type: event.type });
  }
}
