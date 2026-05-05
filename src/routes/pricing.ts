// src/routes/pricing.ts
// Unified price resolution API — resolves best price for a product given context

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { getDbAndUser } from '../utils/query-helpers';
import { ApiError } from '../utils/api-error';

const pricing = new Hono<{ Bindings: Env }>();
pricing.use('*', authMiddleware());

const resolveSchema = z.object({
  product_id: z.string().uuid(),
  price_type: z.enum(['sales', 'purchase']),
  partner_id: z.string().uuid().optional(),
  partner_type: z.enum(['customer', 'supplier']).optional(),
  quantity: z.number().positive().default(1),
  uom_id: z.string().uuid().optional(),
  date: z.string().optional(),
  currency: z.string().optional(),
});

const batchResolveSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive().default(1),
    uom_id: z.string().uuid().optional(),
  })).min(1).max(100),
  price_type: z.enum(['sales', 'purchase']),
  partner_id: z.string().uuid().optional(),
  partner_type: z.enum(['customer', 'supplier']).optional(),
  date: z.string().optional(),
  currency: z.string().optional(),
});

pricing.post('/pricing/resolve', async (c) => {
  const { db, user } = getDbAndUser(c);
  const body = await c.req.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(`Invalid request: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }

  const { product_id, price_type, partner_id, partner_type, quantity, uom_id, date, currency } = parsed.data;

  const { data, error } = await (db as any).rpc('resolve_price', {
    p_organization_id: user.organizationId,
    p_product_id: product_id,
    p_price_type: price_type,
    p_partner_id: partner_id ?? null,
    p_partner_type: partner_type ?? null,
    p_quantity: quantity,
    p_uom_id: uom_id ?? null,
    p_date: date ?? new Date().toISOString().split('T')[0],
    p_currency: currency ?? null,
  });

  if (error) throw ApiError.database(error.message);

  return c.json({ data });
});

pricing.post('/pricing/resolve-batch', async (c) => {
  const { db, user } = getDbAndUser(c);
  const body = await c.req.json();
  const parsed = batchResolveSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(`Invalid request: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }

  const { items, price_type, partner_id, partner_type, date, currency } = parsed.data;
  const resolveDate = date ?? new Date().toISOString().split('T')[0];

  const results = await Promise.all(
    items.map(async (item) => {
      const { data, error } = await (db as any).rpc('resolve_price', {
        p_organization_id: user.organizationId,
        p_product_id: item.product_id,
        p_price_type: price_type,
        p_partner_id: partner_id ?? null,
        p_partner_type: partner_type ?? null,
        p_quantity: item.quantity,
        p_uom_id: item.uom_id ?? null,
        p_date: resolveDate,
        p_currency: currency ?? null,
      });

      if (error) {
        return { product_id: item.product_id, error: error.message, found: false };
      }
      return { product_id: item.product_id, ...data };
    })
  );

  return c.json({ data: results });
});

export default pricing;
