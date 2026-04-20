// src/utils/query-helpers.ts
// Shared query parameter parsing and context extraction for route handlers

import type { Context } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types/env';
import type { UserContext } from '../middleware/auth';
import { createAuthenticatedClient } from './supabase';

export interface RefineQuery {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

/** Parse Refine-compatible query parameters from the request */
export function parseRefineQuery(c: Context, defaultSort = 'created_at'): RefineQuery {
  const rawSort = c.req.query('_sort') ?? defaultSort;
  const sortField = /^[a-z][a-z0-9_]*$/.test(rawSort) ? rawSort : defaultSort;
  return {
    page: parseInt(c.req.query('_page') ?? '1', 10),
    pageSize: Math.min(parseInt(c.req.query('_limit') ?? '20', 10), 500),
    sortField,
    sortOrder: (c.req.query('_order') ?? 'desc') as 'asc' | 'desc',
  };
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
