// src/middleware/error-handler.ts
// Global error handler — outputs RFC 9457 Problem Details

import type { Context } from 'hono';
import { createLogger } from '../utils/logger';
import { ApiError } from '../utils/api-error';
import { ErrorCode, type ApiProblem } from '../types/errors';

const logger = createLogger('error', { module: 'error-handler' });

export function errorHandler(err: Error, c: Context): Response {
  const requestId = (c.get('requestId') as string) ?? 'unknown';

  // If it's our typed ApiError, return the structured problem directly
  if (err instanceof ApiError) {
    err.problem.request_id = requestId;
    logger.warn(`[${requestId}] ${err.problem.type}: ${err.problem.detail}`, {
      status: err.problem.status,
      errors: err.problem.errors,
    });
    return c.json(err.problem, err.problem.status as any) as unknown as Response;
  }

  // Unknown error — log full stack, return generic problem
  logger.error(`[${requestId}] Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
  });

  const problem: ApiProblem = {
    type: ErrorCode.INTERNAL_ERROR,
    status: 500,
    title: 'Internal Server Error',
    detail: 'An unexpected error occurred.',
    request_id: requestId,
    timestamp: new Date().toISOString(),
    hint: `Contact support with request_id '${requestId}' for investigation.`,
  };

  return c.json(problem, 500 as any) as unknown as Response;
}
