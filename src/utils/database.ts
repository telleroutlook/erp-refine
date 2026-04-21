// src/utils/database.ts
// Database query wrapper — typed responses, audit trail, soft-delete helpers

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';

const logger = createLogger('info', { module: 'database' });

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
    if (data === null) throw new Error('No data returned');
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
    if (waitUntil) waitUntil(auditPromise);
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
    .eq('organization_id', organizationId);
  if (Array.isArray(expectedStatus)) {
    q = q.in('status', expectedStatus);
  } else {
    q = q.eq('status', expectedStatus);
  }
  const { data, error } = await q.select(returnSelect).maybeSingle();
  return { data: data as Record<string, unknown> | null, error };
}
