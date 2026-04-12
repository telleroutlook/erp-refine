// src/utils/zod-helpers.ts
// Zod validation utilities for API request handling

import { z } from 'zod';
import type { FieldError } from '../types/errors';
import { ApiError } from './api-error';

/** Convert Zod validation issues to structured FieldError array */
export function zodToFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
    code: issue.code,
    expected: 'expected' in issue ? String(issue.expected) : undefined,
    received: 'received' in issue ? String(issue.received) : undefined,
  }));
}

/** Validate request body against a Zod schema. Throws ApiError on failure. */
export function validateBody<T extends z.ZodType>(
  schema: T,
  data: unknown,
  requestId?: string
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = zodToFieldErrors(result.error);
    throw ApiError.validation(
      `Request validation failed with ${errors.length} error(s).`,
      errors,
      requestId
    );
  }
  return result.data;
}

// --- Common reusable schemas ---

export const paginationSchema = z.object({
  _page: z.coerce.number().int().min(1).default(1),
  _limit: z.coerce.number().int().min(1).max(200).default(20),
  _sort: z.string().optional(),
  _order: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidParam = z.string().uuid('Invalid UUID format');
