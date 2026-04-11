// src/middleware/error-handler.ts
// Global error handler

import type { Context } from 'hono';
import { createLogger } from '../utils/logger';

const logger = createLogger('error', { module: 'error-handler' });

export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') ?? 'unknown';
  logger.error(`[${requestId}] Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
  });

  if (err.message.includes('not found') || err.message.includes('Not found')) {
    return c.json({ error: err.message }, 404) as unknown as Response;
  }

  return c.json({ error: 'Internal server error', requestId }, 500) as unknown as Response;
}
