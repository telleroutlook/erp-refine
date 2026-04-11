// src/index.ts
// Worker entry point — Hono app with middleware, routes, DOs, and Queue consumer

import { Hono } from 'hono';
import type { Env } from './types/env';
import { errorHandler } from './middleware/error-handler';
import { corsMiddleware } from './middleware/cors';
import { requestIdMiddleware } from './middleware/request-id';
import { rateLimitMiddleware } from './middleware/rate-limit';

// Routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import schemaRoutes from './routes/schema';
import procurementRoutes from './routes/procurement';
import salesRoutes from './routes/sales';
import inventoryRoutes from './routes/inventory';
import financeRoutes from './routes/finance';
import masterDataRoutes from './routes/master-data';

// Policy rules (register on startup)
import './policy/rules/procurement-rules';
import './policy/rules/sales-rules';
import './policy/rules/finance-rules';

// Queue consumer
import { handleQueueBatch } from './queues/event-consumer';
import type { ERPEvent } from './queues/event-consumer';

// Durable Objects (must be exported for wrangler)
export { ERPChatAgent } from './do/chat-agent-do';
export { RateLimiterDO } from './do/rate-limiter-do';

const app = new Hono<{ Bindings: Env }>();

// --- Global Middleware ---
app.use('*', corsMiddleware());
app.use('*', requestIdMiddleware());
app.use('/api/*', rateLimitMiddleware());

// --- Health ---
app.get('/health', (c) =>
  c.json({ status: 'ok', version: '0.1.0', env: c.env.ENVIRONMENT })
);

// --- API Routes ---
app.route('/api/auth', authRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/schema', schemaRoutes);
app.route('/api', procurementRoutes);
app.route('/api', salesRoutes);
app.route('/api', inventoryRoutes);
app.route('/api', financeRoutes);
app.route('/api', masterDataRoutes);

// --- Error handler ---
app.onError(errorHandler);

// --- SPA fallback ---
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// --- Default export: Worker fetch handler ---
export default {
  fetch: app.fetch,

  // Queue consumer
  async queue(batch: MessageBatch<ERPEvent>, env: Env): Promise<void> {
    await handleQueueBatch(batch, env);
  },
};
