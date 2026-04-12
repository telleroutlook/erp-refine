// src/utils/api-error.ts
// Typed API error that carries structured problem details

import { HTTPException } from 'hono/http-exception';
import { ErrorCode, ERROR_DEFAULTS, type ApiProblem, type FieldError } from '../types/errors';

export class ApiError extends HTTPException {
  public readonly problem: ApiProblem;

  constructor(opts: {
    code: ErrorCode;
    detail: string;
    requestId?: string;
    errors?: FieldError[];
    hint?: string;
    status?: number;
  }) {
    const defaults = ERROR_DEFAULTS[opts.code];
    const status = opts.status ?? defaults.status;
    const problem: ApiProblem = {
      type: opts.code,
      status,
      title: defaults.title,
      detail: opts.detail,
      request_id: opts.requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
      errors: opts.errors,
      hint: opts.hint,
    };

    super(status as any, { message: opts.detail });
    this.problem = problem;
  }

  /** Create a 422 validation error from field errors */
  static validation(detail: string, errors: FieldError[], requestId?: string, hint?: string): ApiError {
    return new ApiError({
      code: ErrorCode.VALIDATION_ERROR,
      detail,
      requestId,
      errors,
      hint: hint ?? 'Check the errors array for field-level details. Refer to API docs at /api/docs.',
    });
  }

  /** Create a 404 not-found error */
  static notFound(resource: string, id: string, requestId?: string): ApiError {
    return new ApiError({
      code: ErrorCode.NOT_FOUND,
      detail: `${resource} with id '${id}' not found.`,
      requestId,
      hint: `Verify the ${resource} ID exists and belongs to your organization.`,
    });
  }

  /** Create a database error with hint */
  static database(detail: string, requestId?: string, hint?: string): ApiError {
    return new ApiError({
      code: ErrorCode.DATABASE_ERROR,
      detail,
      requestId,
      hint: hint ?? 'Check that all referenced foreign keys exist and required fields are provided.',
    });
  }

  /** Create a state transition error */
  static invalidState(resource: string, currentStatus: string, action: string, requestId?: string): ApiError {
    return new ApiError({
      code: ErrorCode.INVALID_STATE,
      detail: `Cannot ${action} ${resource}: current status is '${currentStatus}'.`,
      requestId,
      hint: `This operation requires the ${resource} to be in a valid state for '${action}'.`,
    });
  }

  /** Create an insufficient stock error */
  static insufficientStock(productId: string, warehouseId: string, required: number, available: number, requestId?: string): ApiError {
    return new ApiError({
      code: ErrorCode.INSUFFICIENT_STOCK,
      detail: `Insufficient stock for product '${productId}' in warehouse '${warehouseId}': required ${required}, available ${available}.`,
      requestId,
      hint: 'Check stock levels with GET /api/stock-records and adjust the quantity or choose a different warehouse.',
    });
  }
}
