// src/index.ts
// Worker entry point — Hono app with middleware, routes, DOs, and Queue consumer

import { Hono } from 'hono';
import type { Env } from './types/env';
import { errorHandler } from './middleware/error-handler';
import { corsMiddleware } from './middleware/cors';
import { requestIdMiddleware } from './middleware/request-id';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { swaggerUI } from '@hono/swagger-ui';

// Routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import schemaRoutes from './routes/schema';
import procurementRoutes from './routes/procurement';
import salesRoutes from './routes/sales';
import inventoryRoutes from './routes/inventory';
import financeRoutes from './routes/finance';
import masterDataRoutes from './routes/master-data';
import partnersRoutes from './routes/partners';
import infrastructureRoutes from './routes/infrastructure';
import adminRoutes from './routes/admin';
import procurementReceivingRoutes from './routes/procurement-receiving';
import salesFinanceRoutes from './routes/sales-finance';
import manufacturingRoutes from './routes/manufacturing';
import qualityRoutes from './routes/quality';
import contractsRoutes from './routes/contracts';
import assetsRoutes from './routes/assets';
import systemRoutes from './routes/system';
import adminAuditRoutes from './routes/admin-audit';
import storageRoutes from './routes/storage';
import draftRoutes from './routes/drafts';

// Policy rules (register on startup)
import './policy/rules/procurement-rules';
import './policy/rules/sales-rules';
import './policy/rules/finance-rules';
import './policy/rules/manufacturing-rules';
import './policy/rules/quality-rules';
import './policy/rules/contracts-rules';
import './policy/rules/inventory-rules';
import './policy/rules/system-rules';

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
  c.json({ status: 'ok' })
);

// --- API Index ---
app.get('/api', (c) => {
  const resources: Record<string, { methods: string[]; href: string }> = {};
  for (const route of app.routes) {
    if (!route.path.startsWith('/api/') || route.path.includes(':')) continue;
    const parts = route.path.replace('/api/', '').split('/');
    const key = parts[0];
    if (!key || key === 'docs' || key === 'openapi.json') continue;
    if (!resources[key]) resources[key] = { methods: [], href: `/api/${key}` };
    const method = route.method.toUpperCase();
    if (!resources[key].methods.includes(method)) {
      resources[key].methods.push(method);
    }
  }
  return c.json({
    name: 'ERP-Refine API',
    version: '0.1.0',
    docs: '/api/docs',
    resources: Object.fromEntries(
      Object.entries(resources).sort(([a], [b]) => a.localeCompare(b))
    ),
  });
});

// --- Swagger UI ---
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

// --- OpenAPI Spec (static for now, will be auto-generated with @hono/zod-openapi later) ---
app.get('/api/openapi.json', (c) => {
  return c.json({
    openapi: '3.1.0',
    info: {
      title: 'ERP-Refine API',
      version: '0.1.0',
      description: 'AI-driven adaptive ERP platform API. All endpoints require Bearer token authentication. Multi-tenant via organization_id in JWT.',
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ProblemDetail: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Machine-readable error code' },
            status: { type: 'integer' },
            title: { type: 'string' },
            detail: { type: 'string', description: 'Human-readable error detail' },
            request_id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
            hint: { type: 'string', description: 'Suggested fix for AI/human consumption' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {},
  });
});

// --- API Routes ---
app.route('/api/auth', authRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/drafts', draftRoutes);
app.route('/api/schema', schemaRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/admin', adminAuditRoutes);
app.route('/api', procurementRoutes);
app.route('/api', procurementReceivingRoutes);
app.route('/api', salesRoutes);
app.route('/api', salesFinanceRoutes);
app.route('/api', inventoryRoutes);
app.route('/api', financeRoutes);
app.route('/api', masterDataRoutes);
app.route('/api', partnersRoutes);
app.route('/api', infrastructureRoutes);
app.route('/api', manufacturingRoutes);
app.route('/api', qualityRoutes);
app.route('/api', contractsRoutes);
app.route('/api', assetsRoutes);
app.route('/api', systemRoutes);
app.route('/api', storageRoutes);

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
