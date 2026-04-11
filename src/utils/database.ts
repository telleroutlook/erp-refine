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
  audit: AuditContext
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

    // Best-effort: write to business_events (fire-and-forget)
    if (success) {
      db.from('business_events').insert({
        organization_id: audit.organizationId,
        event_type: audit.action,
        resource_type: audit.resource,
        resource_id: audit.resourceId,
        actor_id: audit.userId,
        payload: { duration },
      }).then(({ error: e }) => {
        if (e) logger.warn('Failed to write business_event', e);
      });
    }
  }
}

/** Build Supabase query from Refine-style filter params */
export function applyFilters(
  query: ReturnType<SupabaseClient['from']>,
  filters: FilterParam[]
): ReturnType<SupabaseClient['from']> {
  for (const f of filters) {
    switch (f.operator) {
      case 'eq': query = (query as any).eq(f.field, f.value); break;
      case 'ne': query = (query as any).neq(f.field, f.value); break;
      case 'lt': query = (query as any).lt(f.field, f.value); break;
      case 'lte': query = (query as any).lte(f.field, f.value); break;
      case 'gt': query = (query as any).gt(f.field, f.value); break;
      case 'gte': query = (query as any).gte(f.field, f.value); break;
      case 'contains': query = (query as any).ilike(f.field, `%${f.value}%`); break;
      case 'startswith': query = (query as any).ilike(f.field, `${f.value}%`); break;
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
