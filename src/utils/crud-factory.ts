// src/utils/crud-factory.ts
// Generic CRUD route factory — generates standard 5-endpoint Hono router for any entity

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getDbAndUser, parseRefineQuery, parseRefineFilters } from './query-helpers';
import { ApiError } from './api-error';
import { validateBody } from './zod-helpers';
import { ErrorCode } from '../types/errors';
import { executeWithAudit, applyFilters } from './database';

export interface CrudConfig {
  /** DB table name (e.g. 'products') */
  table: string;
  /** URL path segment (e.g. '/products') */
  path: string;
  /** Human-readable resource name for error messages (e.g. 'Product') */
  resourceName: string;

  /** Columns for list query (Supabase select syntax) */
  listSelect: string;
  /** Columns for detail query (usually '*' + relations) */
  detailSelect: string;
  /** Columns returned after create */
  createReturnSelect: string;

  /** Default sort field for list */
  defaultSort?: string;
  /** Whether this table uses soft-delete (deleted_at) — default true */
  softDelete?: boolean;
  /** Whether this table has organization_id — default true */
  orgScoped?: boolean;
  /**
   * For child tables (orgScoped: false), specify the parent FK column and parent table
   * so that update/delete can verify org ownership via the parent record.
   * e.g. { parentFk: 'purchase_order_id', parentTable: 'purchase_orders' }
   */
  parentOwnership?: { parentFk: string; parentTable: string; parentSoftDelete?: boolean };

  /** Zod schema for create validation (optional — skips validation if not provided) */
  createSchema?: z.ZodType;
  /** Zod schema for update validation (optional) */
  updateSchema?: z.ZodType;

  /** Fields to inject on create (e.g. { created_by: user.userId }) */
  createDefaults?: (user: { userId: string; organizationId: string }) => Record<string, unknown>;

  /** Enable auditing for write operations — default false */
  audit?: boolean;

  /** Disable specific operations */
  disableCreate?: boolean;
  disableUpdate?: boolean;
  disableDelete?: boolean;
}

/**
 * Build a Hono router with standard CRUD endpoints:
 *   GET  /path         — paginated list
 *   GET  /path/:id     — single record
 *   POST /path         — create
 *   PUT  /path/:id     — update
 *   DELETE /path/:id   — soft-delete
 */
export function buildCrudRoutes(config: CrudConfig): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const {
    table,
    path,
    resourceName,
    listSelect,
    detailSelect,
    createReturnSelect,
    defaultSort = 'created_at',
    softDelete = true,
    orgScoped = true,
    parentOwnership,
    createSchema,
    updateSchema,
    createDefaults,
    audit = false,
  } = config;

  // --- GET list ---
  router.get(path, async (c) => {
    const { db, user } = getDbAndUser(c);
    const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, defaultSort);
    const filters = parseRefineFilters(c);

    let query = db.from(table).select(listSelect, { count: 'exact' });
    if (orgScoped) query = query.eq('organization_id', user.organizationId);
    if (softDelete) query = query.is('deleted_at', null);
    query = applyFilters(query, filters);
    query = query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error(`[crud-factory] ${resourceName} list error:`, error.message);
      throw ApiError.database('Query failed', c.get('requestId') as string, `Failed to list ${resourceName}. Check sort field '${sortField}' exists.`);
    }
    return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
  });

  // --- GET detail ---
  router.get(`${path}/:id`, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const id = c.req.param('id');

    let query = db.from(table).select(detailSelect).eq('id', id);
    if (orgScoped) query = query.eq('organization_id', user.organizationId);
    if (softDelete) query = query.is('deleted_at', null);

    const { data, error } = await query.single();
    if (error) {
      // PGRST116 = "The result contains 0 rows" (not found); anything else is a real DB error
      if (error.code === 'PGRST116') throw ApiError.notFound(resourceName, id, requestId);
      throw ApiError.database(error.message, requestId, hintForPgError(error));
    }
    return c.json({ data });
  });

  // --- POST create ---
  if (!config.disableCreate) {
    router.post(path, async (c) => {
      const { db, user, requestId } = getDbAndUser(c);
      const rawBody = await c.req.json();
      const body = createSchema ? validateBody(createSchema, rawBody, requestId) : rawBody;

      const BLOCKED_CREATE_FIELDS = new Set(['id', 'organization_id', 'deleted_at', 'created_at', 'updated_at', 'created_by']);
      const insertData: Record<string, unknown> = Object.fromEntries(
        Object.entries(body).filter(([k]) => !BLOCKED_CREATE_FIELDS.has(k))
      );
      if (orgScoped) insertData.organization_id = user.organizationId;
      if (createDefaults) Object.assign(insertData, createDefaults(user));

      const doInsert = async () => {
        const result = await db.from(table).insert(insertData).select(createReturnSelect).single();
        return result as { data: unknown; error: { message: string; code?: string } | null };
      };

      let data: unknown;
      if (audit) {
        data = await executeWithAudit(db, doInsert, {
          userId: user.userId,
          organizationId: user.organizationId,
          requestId,
          action: `create_${table}`,
          resource: table,
        }, c.executionCtx.waitUntil.bind(c.executionCtx) as (p: PromiseLike<unknown>) => void);
      } else {
        const result = await doInsert();
        if (result.error) {
          throw ApiError.database(result.error.message, requestId, hintForPgError(result.error));
        }
        data = result.data;
      }

      return c.json({ data }, 201);
    });
  }

  // --- PUT update ---
  if (!config.disableUpdate) {
    router.put(`${path}/:id`, async (c) => {
      const { db, user, requestId } = getDbAndUser(c);
      const id = c.req.param('id');
      const rawBody = await c.req.json();
      const body = updateSchema ? validateBody(updateSchema, rawBody, requestId) : rawBody;

      if (!orgScoped && parentOwnership) {
        const parentAlias = `parent_check:${parentOwnership.parentTable}!inner(id)`;
        const { data: child, error: childErr } = await db
          .from(table)
          .select(`id, ${parentAlias}`)
          .eq('id', id)
          .is('deleted_at', null)
          .eq(`${parentOwnership.parentTable}.organization_id`, user.organizationId)
          .single();
        if (childErr || !child) throw ApiError.notFound(resourceName, id, requestId);
      }

      const doUpdate = async () => {
        const BLOCKED_FIELDS = new Set(['id', 'organization_id', 'deleted_at', 'created_at', 'updated_at', 'created_by']);
        const sanitized = updateSchema ? body : Object.fromEntries(Object.entries(body).filter(([k]) => !BLOCKED_FIELDS.has(k)));
        let q = db.from(table).update(sanitized).eq('id', id);
        if (orgScoped) q = q.eq('organization_id', user.organizationId);
        if (softDelete) q = q.is('deleted_at', null);
        const result = await q.select('id').single();
        return result as { data: unknown; error: { message: string; code?: string } | null };
      };

      if (audit) {
        const data = await executeWithAudit(db, doUpdate, {
          userId: user.userId,
          organizationId: user.organizationId,
          requestId,
          action: `update_${table}`,
          resource: table,
          resourceId: id,
        }, c.executionCtx.waitUntil.bind(c.executionCtx) as (p: PromiseLike<unknown>) => void);
        return c.json({ data });
      }

      const { data, error } = await doUpdate();
      if (error) throw ApiError.database(error.message, requestId, hintForPgError(error));
      if (!data) throw ApiError.notFound(resourceName, id, requestId);
      return c.json({ data });
    });
  }

  // --- DELETE (soft-delete) ---
  if (!config.disableDelete) {
    router.delete(`${path}/:id`, async (c) => {
      const { db, user, requestId } = getDbAndUser(c);
      const id = c.req.param('id');

      if (!orgScoped && parentOwnership) {
        const parentAlias = `parent_check:${parentOwnership.parentTable}!inner(id)`;
        const { data: child, error: childErr } = await db
          .from(table)
          .select(`id, ${parentAlias}`)
          .eq('id', id)
          .is('deleted_at', null)
          .eq(`${parentOwnership.parentTable}.organization_id`, user.organizationId)
          .single();
        if (childErr || !child) throw ApiError.notFound(resourceName, id, requestId);
      }

      if (softDelete) {
        let q = db
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (orgScoped) q = q.eq('organization_id', user.organizationId);
        q = q.is('deleted_at', null);
        const { data, error } = await q.select('id').maybeSingle();
        if (error) throw ApiError.database(error.message, requestId);
        if (!data) throw ApiError.notFound(resourceName, id, requestId);
      } else {
        let q = db.from(table).delete().eq('id', id);
        if (orgScoped) q = q.eq('organization_id', user.organizationId);
        const { error } = await q;
        if (error) throw ApiError.database(error.message, requestId);
      }

      return c.json({ data: { success: true } });
    });
  }

  return router;
}

// ────────────────────────────────────────────────────────────────────────────
// Nested CRUD factory
// Generates 5 endpoints under /:parentParam/:parentId/<childPath> with an
// org-scoped parent ownership check on every request.
// ────────────────────────────────────────────────────────────────────────────

export interface NestedCrudConfig {
  /** Parent table (e.g. 'customers') */
  parentTable: string;
  /** Parent route param name (e.g. 'customerId') — used in path segment */
  parentParam: string;
  /** FK column in child table pointing to parent (e.g. 'customer_id') */
  parentFk: string;
  /** Child table (e.g. 'customer_addresses') */
  childTable: string;
  /** URL sub-path for the collection (e.g. 'addresses') */
  childPath: string;
  /** Human-readable child resource name for errors (e.g. 'CustomerAddress') */
  childResourceName: string;
  /** Columns for list query */
  childListSelect: string;
  /** Columns for detail query (usually '*') */
  childDetailSelect?: string;
  /** Columns returned after create/update */
  childReturnSelect: string;
  /** Default sort field — default 'id' */
  defaultSort?: string;
  /** Whether child uses soft-delete — default true */
  softDelete?: boolean;
  /** Extra fields to inject on create (beyond parentFk + org if needed) */
  createExtras?: (user: { userId: string; organizationId: string }) => Record<string, unknown>;
}

export function buildNestedCrudRoutes(config: NestedCrudConfig): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const {
    parentTable,
    parentParam,
    parentFk,
    childTable,
    childPath,
    childResourceName,
    childListSelect,
    childDetailSelect = '*',
    childReturnSelect,
    defaultSort = 'id',
    softDelete = true,
    createExtras,
  } = config;

  const base = `/:${parentParam}/${childPath}`;

  /** Verify the parent belongs to the org, throw 404 otherwise */
  async function assertParentOwned(
    db: SupabaseClient,
    parentId: string,
    orgId: string,
    requestId: string
  ): Promise<void> {
    const { data, error } = await db
      .from(parentTable)
      .select('id')
      .eq('id', parentId)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();
    if (error || !data) {
      throw ApiError.notFound(parentTable.charAt(0).toUpperCase() + parentTable.slice(1, -1), parentId, requestId);
    }
  }

  // GET list
  router.get(base, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const parentId = c.req.param(parentParam)!;
    const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, defaultSort);
    await assertParentOwned(db, parentId, user.organizationId, requestId);

    let query = db
      .from(childTable)
      .select(childListSelect, { count: 'exact' })
      .eq(parentFk, parentId);
    if (softDelete) query = query.is('deleted_at', null);
    query = query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw ApiError.database(error.message, requestId);
    return c.json({ data: data ?? [], total: count ?? 0, page, pageSize });
  });

  // GET detail
  router.get(`${base}/:id`, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const parentId = c.req.param(parentParam)!;
    const id = c.req.param('id');
    await assertParentOwned(db, parentId, user.organizationId, requestId);

    let query = db.from(childTable).select(childDetailSelect).eq('id', id).eq(parentFk, parentId);
    if (softDelete) query = query.is('deleted_at', null);

    const { data, error } = await query.single();
    if (error || !data) throw ApiError.notFound(childResourceName, id, requestId);
    return c.json({ data });
  });

  // POST create
  router.post(base, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const parentId = c.req.param(parentParam)!;
    await assertParentOwned(db, parentId, user.organizationId, requestId);

    const body = await c.req.json();
    const BLOCKED_FIELDS = new Set(['id', 'organization_id', 'deleted_at', 'created_at', 'created_by']);
    const sanitizedBody = Object.fromEntries(Object.entries(body).filter(([k]) => !BLOCKED_FIELDS.has(k)));
    const insertData: Record<string, unknown> = { ...sanitizedBody, [parentFk]: parentId };
    if (createExtras) Object.assign(insertData, createExtras(user));

    const { data, error } = await db
      .from(childTable)
      .insert(insertData)
      .select(childReturnSelect)
      .single();
    if (error) throw ApiError.database(error.message, requestId);
    return c.json({ data }, 201);
  });

  // PUT update
  router.put(`${base}/:id`, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const parentId = c.req.param(parentParam)!;
    const id = c.req.param('id');
    await assertParentOwned(db, parentId, user.organizationId, requestId);

    const rawBody = await c.req.json();
    const BLOCKED = new Set(['id', 'organization_id', 'deleted_at', 'created_at', 'created_by']);
    const body = Object.fromEntries(Object.entries(rawBody).filter(([k]) => !BLOCKED.has(k)));
    let q = db
      .from(childTable)
      .update(body)
      .eq('id', id)
      .eq(parentFk, parentId);
    if (softDelete) q = q.is('deleted_at', null);
    const { data, error } = await q
      .select('id')
      .single();
    if (error) throw ApiError.database(error.message, requestId);
    if (!data) throw ApiError.notFound(childResourceName, id, requestId);
    return c.json({ data });
  });

  // DELETE (soft-delete or hard-delete)
  router.delete(`${base}/:id`, async (c) => {
    const { db, user, requestId } = getDbAndUser(c);
    const parentId = c.req.param(parentParam)!;
    const id = c.req.param('id');
    await assertParentOwned(db, parentId, user.organizationId, requestId);

    if (softDelete) {
      const { data, error } = await db
        .from(childTable)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq(parentFk, parentId)
        .select('id')
        .maybeSingle();
      if (error) throw ApiError.database(error.message, requestId);
      if (!data) throw ApiError.notFound(childResourceName, id, requestId);
    } else {
      const { data, error } = await db
        .from(childTable)
        .delete()
        .eq('id', id)
        .eq(parentFk, parentId)
        .select('id')
        .maybeSingle();
      if (error) throw ApiError.database(error.message, requestId);
      if (!data) throw ApiError.notFound(childResourceName, id, requestId);
    }
    return c.json({ data: { success: true } });
  });

  return router;
}

// ────────────────────────────────────────────────────────────────────────────
// Standalone delete helpers — use in hand-written routes that can't use the
// full buildCrudRoutes factory because their GET/POST/PUT are custom.
// ────────────────────────────────────────────────────────────────────────────

export async function performSoftDelete(
  db: SupabaseClient,
  table: string,
  id: string,
  organizationId: string,
  resourceName: string,
  requestId: string
): Promise<void> {
  const { data, error } = await db
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound(resourceName, id, requestId);
}

export async function performHardDelete(
  db: SupabaseClient,
  table: string,
  id: string,
  organizationId: string,
  resourceName: string,
  requestId: string
): Promise<void> {
  const { data, error } = await db
    .from(table)
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select('id')
    .maybeSingle();
  if (error) throw ApiError.database(error.message, requestId);
  if (!data) throw ApiError.notFound(resourceName, id, requestId);
}

/** Generate a helpful hint from a Postgres error */
function hintForPgError(error: { message?: string; code?: string; details?: string; hint?: string }): string {
  if (error.hint) return error.hint;
  const msg = error.message ?? '';
  if (msg.includes('violates foreign key')) {
    const match = msg.match(/Key \((\w+)\)=\(([^)]+)\) is not present/);
    if (match) return `The referenced ${match[1]} '${match[2]}' does not exist. Create it first or check the ID.`;
    return 'A referenced record does not exist. Verify all foreign key IDs.';
  }
  if (msg.includes('violates unique constraint')) {
    const match = msg.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (match) return `A record with ${match[1]}='${match[2]}' already exists. Use a different value or update the existing record.`;
    return 'A record with this unique key already exists.';
  }
  if (msg.includes('violates not-null constraint')) {
    const match = msg.match(/column "(\w+)"/);
    if (match) return `The field '${match[1]}' is required and cannot be null.`;
    return 'A required field is missing.';
  }
  if (msg.includes('violates check constraint')) {
    return 'A value failed a validation check. Refer to the API docs for allowed values.';
  }
  return 'Check that all required fields are provided and referenced entities exist.';
}
