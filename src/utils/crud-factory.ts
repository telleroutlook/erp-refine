// src/utils/crud-factory.ts
// Generic CRUD route factory — generates standard 5-endpoint Hono router for any entity

import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { z } from 'zod';
import { getDbAndUser, parseRefineQuery } from './query-helpers';
import { ApiError } from './api-error';
import { validateBody } from './zod-helpers';
import { ErrorCode } from '../types/errors';
import { executeWithAudit } from './database';

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
    createSchema,
    updateSchema,
    createDefaults,
    audit = false,
  } = config;

  // --- GET list ---
  router.get(path, async (c) => {
    const { db, user } = getDbAndUser(c);
    const { page, pageSize, sortField, sortOrder } = parseRefineQuery(c, defaultSort);

    let query = db.from(table).select(listSelect, { count: 'exact' });
    if (orgScoped) query = query.eq('organization_id', user.organizationId);
    if (softDelete) query = query.is('deleted_at', null);
    query = query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      throw ApiError.database(error.message, c.get('requestId') as string, `Failed to list ${resourceName}. Check sort field '${sortField}' exists.`);
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
    if (error) throw ApiError.notFound(resourceName, id, requestId);
    return c.json({ data });
  });

  // --- POST create ---
  if (!config.disableCreate) {
    router.post(path, async (c) => {
      const { db, user, requestId } = getDbAndUser(c);
      const rawBody = await c.req.json();
      const body = createSchema ? validateBody(createSchema, rawBody, requestId) : rawBody;

      const insertData: Record<string, unknown> = { ...body };
      if (orgScoped) insertData.organization_id = user.organizationId;
      if (createDefaults) Object.assign(insertData, createDefaults(user));

      const doInsert = async () => {
        const result = await db.from(table).insert(insertData).select(createReturnSelect).single();
        return result as { data: any; error: any };
      };

      let data: unknown;
      if (audit) {
        data = await executeWithAudit(db, doInsert, {
          userId: user.userId,
          organizationId: user.organizationId,
          requestId,
          action: `create_${table}`,
          resource: table,
        });
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

      const doUpdate = async () => {
        const result = await db.from(table).update(body).eq('id', id).eq('organization_id', user.organizationId).select('id').single();
        return result as { data: any; error: any };
      };

      if (audit) {
        const data = await executeWithAudit(db, doUpdate, {
          userId: user.userId,
          organizationId: user.organizationId,
          requestId,
          action: `update_${table}`,
          resource: table,
          resourceId: id,
        });
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

      if (softDelete) {
        const { error } = await db
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('organization_id', user.organizationId);
        if (error) throw ApiError.database(error.message, requestId);
      } else {
        const { error } = await db.from(table).delete().eq('id', id).eq('organization_id', user.organizationId);
        if (error) throw ApiError.database(error.message, requestId);
      }

      return c.json({ data: { success: true } });
    });
  }

  return router;
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
