// src/types/errors.ts
// Structured error types based on RFC 9457 Problem Details

/** Machine-readable error codes */
export const ErrorCode = {
  // Client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_STATE: 'INVALID_STATE',
  CONFLICT: 'CONFLICT',
  REFERENCE_ERROR: 'REFERENCE_ERROR',

  // Business logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  BALANCE_MISMATCH: 'BALANCE_MISMATCH',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  IMMUTABLE_RECORD: 'IMMUTABLE_RECORD',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Default HTTP status and title for each error code */
export const ERROR_DEFAULTS: Record<ErrorCode, { status: number; title: string }> = {
  VALIDATION_ERROR: { status: 422, title: 'Validation Error' },
  NOT_FOUND: { status: 404, title: 'Not Found' },
  ALREADY_EXISTS: { status: 409, title: 'Already Exists' },
  UNAUTHORIZED: { status: 401, title: 'Unauthorized' },
  FORBIDDEN: { status: 403, title: 'Forbidden' },
  INVALID_STATE: { status: 409, title: 'Invalid State Transition' },
  CONFLICT: { status: 409, title: 'Conflict' },
  REFERENCE_ERROR: { status: 422, title: 'Reference Error' },
  INSUFFICIENT_STOCK: { status: 422, title: 'Insufficient Stock' },
  BALANCE_MISMATCH: { status: 422, title: 'Balance Mismatch' },
  APPROVAL_REQUIRED: { status: 403, title: 'Approval Required' },
  IMMUTABLE_RECORD: { status: 409, title: 'Immutable Record' },
  INTERNAL_ERROR: { status: 500, title: 'Internal Server Error' },
  DATABASE_ERROR: { status: 500, title: 'Database Error' },
  EXTERNAL_SERVICE_ERROR: { status: 502, title: 'External Service Error' },
};

/** Field-level validation error */
export interface FieldError {
  field: string;
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

/** RFC 9457 Problem Details response body */
export interface ApiProblem {
  type: ErrorCode;
  status: number;
  title: string;
  detail: string;
  request_id: string;
  timestamp: string;
  errors?: FieldError[];
  hint?: string;
}
