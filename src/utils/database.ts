// src/utils/database.ts
// Database query wrapper — typed responses, audit trail, soft-delete helpers

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';
import { ApiError } from './api-error';
import { ErrorCode } from '../types/errors';

import type { ItemFilter } from './query-helpers';

const logger = createLogger('info', { module: 'database' });

/**
 * Resolve employee.id from auth user UUID.
 * Tables like purchase_requisitions.created_by FK → employees.id (not auth.users.id).
 */
export async function resolveEmployeeId(db: SupabaseClient, authUserId: string, organizationId: string): Promise<string | null> {
  const { data } = await db.from('employees').select('id').eq('user_id', authUserId).eq('organization_id', organizationId).maybeSingle();
  return data?.id ?? null;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface SortParam {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParam {
  field: string;
  operator: string;
  value: unknown;
}

export interface AuditContext {
  userId: string;
  organizationId: string;
  requestId?: string;
  action: string;
  resource: string;
  resourceId?: string;
}

/** Execute a query and record an audit entry */
export async function executeWithAudit<T>(
  db: SupabaseClient,
  operation: () => Promise<{ data: T | null; error: unknown }>,
  audit: AuditContext,
  waitUntil?: (promise: PromiseLike<unknown>) => void
): Promise<T> {
  const start = Date.now();
  let success = false;
  let errorMsg: string | undefined;

  try {
    const { data, error } = await operation();
    if (error) throw error;
    if (data === null) throw ApiError.notFound(audit.resource, audit.resourceId ?? 'unknown', audit.requestId);
    success = true;
    return data;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    logger.info('db.audit', {
      action: audit.action,
      resource: audit.resource,
      resourceId: audit.resourceId,
      userId: audit.userId,
      organizationId: audit.organizationId,
      requestId: audit.requestId,
      success,
      duration,
      error: errorMsg,
    });

    // Best-effort: write to business_events (fire-and-forget) for both success and failure
    const auditPromise = db.from('business_events').insert({
      organization_id: audit.organizationId,
      event_type: audit.action,
      entity_type: audit.resource,
      entity_id: audit.resourceId,
      payload: { actor_id: audit.userId, duration, success, error_message: errorMsg ?? null },
      severity: 'info',
    }).then(({ error: e }) => {
      if (e) logger.warn('Failed to write business_event', e);
    });
    if (waitUntil) {
      waitUntil(auditPromise);
    } else {
      await auditPromise;
    }
  }
}

/** Build Supabase query from Refine-style filter params */
export function applyFilters<T>(
  query: T,
  filters: FilterParam[]
): T {
  for (const f of filters) {
    switch (f.operator) {
      case 'eq': query = (query as any).eq(f.field, f.value); break;
      case 'ne': query = (query as any).neq(f.field, f.value); break;
      case 'lt': query = (query as any).lt(f.field, f.value); break;
      case 'lte': query = (query as any).lte(f.field, f.value); break;
      case 'gt': query = (query as any).gt(f.field, f.value); break;
      case 'gte': query = (query as any).gte(f.field, f.value); break;
      case 'contains': {
        const esc = String(f.value).replace(/%/g, '\\%').replace(/_/g, '\\_');
        query = (query as any).ilike(f.field, `%${esc}%`);
        break;
      }
      case 'startswith': {
        const esc = String(f.value).replace(/%/g, '\\%').replace(/_/g, '\\_');
        query = (query as any).ilike(f.field, `${esc}%`);
        break;
      }
      case 'null': query = (query as any).is(f.field, null); break;
      case 'nnull': query = (query as any).not(f.field, 'is', null); break;
      case 'in': query = (query as any).in(f.field, f.value as unknown[]); break;
    }
  }
  return query;
}

export interface ItemJoinConfig {
  itemsTable: string;
  alias?: string;
}

/**
 * Build a select string that adds an `!inner` join for item-level filtering.
 * When itemFilters is empty, returns baseSelect unchanged.
 */
export function buildSelectWithItemFilter(
  baseSelect: string,
  config: ItemJoinConfig,
  itemFilters: ItemFilter[],
): string {
  if (itemFilters.length === 0) return baseSelect;
  const alias = config.alias ?? 'filter_items';
  return `${baseSelect}, ${alias}:${config.itemsTable}!inner(id)`;
}

/** Apply item-level filters by eq on the joined items table */
export function applyItemFilters<T>(
  query: T,
  config: ItemJoinConfig,
  itemFilters: ItemFilter[],
): T {
  for (const f of itemFilters) {
    query = (query as any).eq(`${config.itemsTable}.${f.field}`, f.value);
  }
  return query;
}

/** Apply sort and pagination */
export function applyPagination(
  query: ReturnType<SupabaseClient['from']>,
  sort: SortParam[] = [],
  page: PageParams = {}
): ReturnType<SupabaseClient['from']> {
  for (const s of sort) {
    query = (query as any).order(s.field, { ascending: s.order === 'asc' });
  }
  const pageSize = page.pageSize ?? 20;
  const pageNum = page.page ?? 1;
  const from = (pageNum - 1) * pageSize;
  query = (query as any).range(from, from + pageSize - 1);
  return query;
}

/**
 * Atomic status transition — single UPDATE with WHERE status = expectedStatus.
 * Returns the updated row or null if 0 rows matched (stale status).
 */
export async function atomicStatusTransition(
  db: SupabaseClient,
  table: string,
  id: string,
  organizationId: string,
  expectedStatus: string | string[],
  newFields: Record<string, unknown>,
  returnSelect = 'id, status'
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  let q = db
    .from(table)
    .update(newFields)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);
  if (Array.isArray(expectedStatus)) {
    q = q.in('status', expectedStatus);
  } else {
    q = q.eq('status', expectedStatus);
  }
  const { data, error } = await q.select(returnSelect).maybeSingle();
  return { data: data as Record<string, unknown> | null, error };
}

export interface AuditedTransitionParams {
  db: SupabaseClient;
  table: string;
  id: string;
  organizationId: string;
  userId: string;
  expectedStatus: string | string[];
  newFields: Record<string, unknown>;
  action: string;
  returnSelect?: string;
  waitUntil?: (promise: PromiseLike<unknown>) => void;
}

/**
 * atomicStatusTransition + audit trail (business_events).
 * Use this in AI tools where every status change must be recorded.
 */
export async function auditedStatusTransition(
  params: AuditedTransitionParams
): Promise<Record<string, unknown>> {
  const { db, table, id, organizationId, userId, expectedStatus, newFields, action, returnSelect = 'id, status', waitUntil } = params;

  return executeWithAudit(
    db,
    async () => {
      const { data, error } = await atomicStatusTransition(db, table, id, organizationId, expectedStatus, newFields, returnSelect);
      return { data, error };
    },
    { userId, organizationId, action, resource: table, resourceId: id },
    waitUntil,
  );
}

/**
 * Assert that a record exists and belongs to the given organization.
 * Throws if not found or access denied — use before querying child tables.
 */
export async function assertOwnership(
  db: SupabaseClient,
  table: string,
  id: string,
  organizationId: string,
  label: string,
  opts?: { skipDeletedCheck?: boolean }
): Promise<void> {
  let q = db.from(table).select('id').eq('id', id).eq('organization_id', organizationId);
  if (!opts?.skipDeletedCheck) q = q.is('deleted_at', null);
  const { data, error } = await q.maybeSingle();
  if (error) throw new ApiError({ code: ErrorCode.NOT_FOUND, detail: error.message });
  if (!data) throw ApiError.notFound(label, id);
}
