// src/utils/query-helpers.ts
// Shared query parameter parsing and context extraction for route handlers

import type { Context } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types/env';
import type { UserContext } from '../middleware/auth';
import type { FilterParam } from './database';
import { createAuthenticatedClient } from './supabase';

export interface SortSpec {
  field: string;
  order: 'asc' | 'desc';
}

export interface RefineQuery {
  page: number;
  pageSize: number;
  sorts: SortSpec[];
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

const FIELD_PATTERN = /^[a-z][a-z0-9_]*$/;
const MAX_SORTS = 3;

/** Parse Refine-compatible query parameters from the request */
export function parseRefineQuery(c: Context, defaultSort = 'created_at'): RefineQuery {
  const rawSort = c.req.query('_sort') ?? defaultSort;
  const rawOrder = c.req.query('_order') ?? 'desc';

  const fields = rawSort.split(',').map(f => f.trim()).filter(f => FIELD_PATTERN.test(f)).slice(0, MAX_SORTS);
  const orders = rawOrder.split(',').map(o => o.trim() === 'asc' ? 'asc' as const : 'desc' as const);

  while (orders.length < fields.length) orders.push('desc');

  const sorts: SortSpec[] = fields.length > 0
    ? fields.map((f, i) => ({ field: f, order: orders[i]! }))
    : [{ field: defaultSort, order: 'desc' as const }];

  return {
    page: Math.max(parseInt(c.req.query('_page') ?? '1', 10) || 1, 1),
    pageSize: Math.min(Math.max(parseInt(c.req.query('_limit') ?? '20', 10) || 20, 1), 100),
    sorts,
    sortField: sorts[0]!.field,
    sortOrder: sorts[0]!.order,
  };
}

const RESERVED_PARAMS = new Set(['_page', '_limit', '_sort', '_order', '_start', '_end']);
const DENIED_FIELDS = new Set(['organization_id', 'deleted_at', 'created_by', 'updated_by']);
const FIELD_RE = /^[a-z][a-z0-9_]*$/;

/** Parse Refine-compatible filter query parameters into FilterParam[] */
export function parseRefineFilters(c: Context): FilterParam[] {
  const filters: FilterParam[] = [];
  const url = new URL(c.req.url);
  for (const [key, value] of url.searchParams.entries()) {
    if (RESERVED_PARAMS.has(key) || !value) continue;

    if (key.endsWith('_ne') && FIELD_RE.test(key.slice(0, -3))) {
      const field = key.slice(0, -3);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'ne', value });
    } else if (key.endsWith('_like') && FIELD_RE.test(key.slice(0, -5))) {
      const field = key.slice(0, -5);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'contains', value });
    } else if (key.endsWith('_in') && FIELD_RE.test(key.slice(0, -3))) {
      const field = key.slice(0, -3);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'in', value: value.split(',').slice(0, 100) });
    } else if (key.endsWith('_is') && FIELD_RE.test(key.slice(0, -3))) {
      const field = key.slice(0, -3);
      if (!DENIED_FIELDS.has(field)) {
        if (value === 'null') {
          filters.push({ field, operator: 'null', value: null });
        } else if (value === 'not.null') {
          filters.push({ field, operator: 'nnull', value: null });
        }
      }
    } else if (key.endsWith('_gte') && FIELD_RE.test(key.slice(0, -4))) {
      const field = key.slice(0, -4);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'gte', value });
    } else if (key.endsWith('_lte') && FIELD_RE.test(key.slice(0, -4))) {
      const field = key.slice(0, -4);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'lte', value });
    } else if (key.endsWith('_gt') && FIELD_RE.test(key.slice(0, -3))) {
      const field = key.slice(0, -3);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'gt', value });
    } else if (key.endsWith('_lt') && FIELD_RE.test(key.slice(0, -3))) {
      const field = key.slice(0, -3);
      if (!DENIED_FIELDS.has(field)) filters.push({ field, operator: 'lt', value });
    } else if (FIELD_RE.test(key) && !DENIED_FIELDS.has(key)) {
      filters.push({ field: key, operator: 'eq', value });
    }
  }
  return filters;
}

export interface ItemFilter {
  field: string;
  value: string;
}

/** Parse item-level filters from query params prefixed with `_item_` (e.g. `_item_product_id=xxx`) */
export function parseItemFilters(c: Context): ItemFilter[] {
  const filters: ItemFilter[] = [];
  const url = new URL(c.req.url);
  for (const [key, value] of url.searchParams.entries()) {
    if (!key.startsWith('_item_') || !value) continue;
    const field = key.slice(6); // strip '_item_'
    if (FIELD_RE.test(field) && !DENIED_FIELDS.has(field)) {
      filters.push({ field, value });
    }
  }
  return filters;
}

export interface DbContext {
  db: SupabaseClient;
  user: UserContext;
  requestId: string;
}

/** Extract authenticated Supabase client + user context from Hono context */
export function getDbAndUser(c: Context<{ Bindings: Env }>): DbContext {
  const user = c.get('user') as UserContext;
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const jwt = authHeader.slice(7);
  const db = createAuthenticatedClient(c.env, jwt);
  const requestId = c.get('requestId') as string ?? 'unknown';
  return { db, user, requestId };
}
