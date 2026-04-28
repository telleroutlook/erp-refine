// src/tools/manufacturing-tools.ts
// Manufacturing domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { atomicStatusTransition, executeWithAudit } from '../utils/database';

export function createManufacturingTools(db: SupabaseClient, organizationId: string, userId: string) {
  return {
    get_work_order: tool({
      description: 'Get work order detail including materials and production records',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('work_orders')
          .select(`
            *, product:products(id,name,code), warehouse:warehouses(id,name,code),
            bom:bom_headers(id,bom_number),
            materials:work_order_materials(*, product:products(id,name,code)),
            productions:work_order_productions(id,production_date,quantity,defective_quantity,notes)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_bom_headers: tool({
      description: 'List bills of materials (BOM)',
      inputSchema: z.object({
        productId: z.string().uuid().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ productId, search, limit }) => {
        let query = db
          .from('bom_headers')
          .select('id, bom_number, product:products(id,name,code), effective_date, is_active, version')
          .eq('organization_id', organizationId);

        if (productId) query = query.eq('product_id', productId);
        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.ilike('bom_number', `%${s}%`);
        }

        const { data, error } = await query.order('bom_number').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    get_bom: tool({
      description: 'Get BOM detail with all component items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('bom_headers')
          .select(`
            *, product:products(id,name,code),
            items:bom_items(*, component:products!product_id(id,name,code), uom:uoms!unit(uom_code,uom_name))
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_work_orders: tool({
      description: 'List work orders',
      inputSchema: z.object({
        status: z.enum(['draft','released','in_progress','completed','cancelled']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('work_orders')
          .select('id, work_order_number, status, start_date, planned_completion_date, planned_quantity, completed_quantity, product:products(id,name,code)')
          .eq('organization_id', organizationId);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('start_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_work_order_materials: tool({
      description: 'List material requirements for a work order',
      inputSchema: z.object({ workOrderId: z.string().uuid() }),
      execute: async ({ workOrderId }) => {
        const { data, error } = await db
          .from('work_order_materials')
          .select('id, required_quantity, issued_quantity, status, notes, product:products(id,name,code)')
          .eq('work_order_id', workOrderId)
          .eq('organization_id', organizationId);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_work_order_productions: tool({
      description: 'List production records (output entries) for a work order',
      inputSchema: z.object({ workOrderId: z.string().uuid() }),
      execute: async ({ workOrderId }) => {
        const { data, error } = await db
          .from('work_order_productions')
          .select('id, production_date, quantity, qualified_quantity, defective_quantity, notes, created_by')
          .eq('work_order_id', workOrderId)
          .eq('organization_id', organizationId)
          .order('production_date', { ascending: false });
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    create_work_order: tool({
      description: 'Create a new work order from a BOM (requires D2 confirmation)',
      inputSchema: z.object({
        productId: z.string().uuid(),
        bomHeaderId: z.string().uuid(),
        plannedQuantity: z.number().positive(),
        startDate: z.string().describe('ISO date string').optional(),
        plannedCompletionDate: z.string().describe('ISO date string').optional(),
        warehouseId: z.string().uuid().optional(),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ productId, bomHeaderId, plannedQuantity, startDate, plannedCompletionDate, warehouseId, notes, confirmed }) => {
        const { data: bomItems, error: bomErr } = await db
          .from('bom_items')
          .select('product_id, quantity')
          .eq('bom_header_id', bomHeaderId)
          .eq('organization_id', organizationId);
        if (bomErr) throw new Error(bomErr.message);

        const materials = (bomItems ?? []).map(bi => ({
          productId: bi.product_id,
          requiredQuantity: bi.quantity * plannedQuantity,
        }));

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            productId,
            bomHeaderId,
            plannedQuantity,
            materialCount: materials.length,
            materials: materials.slice(0, 10),
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'work_order',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');

        const wo = await executeWithAudit(
          db,
          async () => {
            const result = await db.from('work_orders').insert({
              organization_id: organizationId,
              work_order_number: seqData,
              product_id: productId,
              bom_header_id: bomHeaderId,
              planned_quantity: plannedQuantity,
              completed_quantity: 0,
              start_date: startDate ?? null,
              planned_completion_date: plannedCompletionDate ?? null,
              warehouse_id: warehouseId ?? null,
              status: 'draft',
              notes: notes ?? null,
            }).select('id, work_order_number').single();
            return result as { data: { id: string; work_order_number: string } | null; error: unknown };
          },
          { action: 'create', resource: 'work_orders', userId, organizationId },
        ) as { id: string; work_order_number: string };

        if (materials.length > 0) {
          const matRows = materials.map(m => ({
            work_order_id: wo.id,
            organization_id: organizationId,
            product_id: m.productId,
            required_quantity: m.requiredQuantity,
            issued_quantity: 0,
            status: 'pending',
            warehouse_id: warehouseId ?? null,
          }));
          const { error: matErr } = await db.from('work_order_materials').insert(matRows);
          if (matErr) {
            await db.from('work_orders').delete().eq('id', wo.id);
            throw new Error(matErr.message);
          }
        }

        return { id: wo.id, workOrderNumber: wo.work_order_number, status: 'draft', plannedQuantity, materialCount: materials.length };
      },
    }),

    issue_work_order_materials: tool({
      description: 'Issue materials for a work order from warehouse (D2 — requires confirmation)',
      inputSchema: z.object({
        workOrderId: z.string().uuid(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ workOrderId, confirmed }) => {
        const { data: wo, error } = await db
          .from('work_orders')
          .select('id, work_order_number, status')
          .eq('id', workOrderId)
          .eq('organization_id', organizationId)
          .single();
        if (error || !wo) throw new Error('Work order not found');
        if (!['released', 'in_progress'].includes(wo.status)) {
          throw new Error(`Cannot issue materials for WO in status '${wo.status}'`);
        }

        const { data: materials } = await db
          .from('work_order_materials')
          .select('id, product_id, required_quantity, issued_quantity, status')
          .eq('work_order_id', workOrderId)
          .eq('status', 'pending');

        const pendingMaterials = materials ?? [];

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run — set confirmed=true to issue materials (will deduct stock)',
            workOrderId: wo.id,
            workOrderNumber: wo.work_order_number,
            pendingMaterialCount: pendingMaterials.length,
          };
        }

        for (const mat of pendingMaterials) {
          const issueQty = mat.required_quantity - mat.issued_quantity;
          if (issueQty <= 0) continue;

          await db
            .from('work_order_materials')
            .update({ issued_quantity: mat.required_quantity, status: 'issued' })
            .eq('id', mat.id)
            .eq('work_order_id', wo.id);
        }

        if (wo.status === 'released') {
          const { data: updated } = await atomicStatusTransition(
            db, 'work_orders', wo.id, organizationId, 'released', { status: 'in_progress' }, 'id',
          );
          if (!updated) throw new Error('Work order status changed concurrently; please retry');
        }

        return { workOrderId: wo.id, workOrderNumber: wo.work_order_number, issuedCount: pendingMaterials.length };
      },
    }),

    complete_work_order: tool({
      description: 'Complete a work order (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        completedQuantity: z.number().nonnegative().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, completedQuantity, confirmed }) => {
        const { data: wo, error } = await db
          .from('work_orders')
          .select('id, work_order_number, status, planned_quantity, completed_quantity')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .single();
        if (error || !wo) throw new Error('Work order not found');
        if (!['released', 'in_progress'].includes(wo.status)) {
          throw new Error(`Cannot complete WO in status '${wo.status}'`);
        }

        const finalQty = completedQuantity ?? wo.completed_quantity ?? wo.planned_quantity;

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run — set confirmed=true to complete',
            id: wo.id,
            workOrderNumber: wo.work_order_number,
            plannedQuantity: wo.planned_quantity,
            completedQuantity: finalQty,
          };
        }

        const { data: updated } = await atomicStatusTransition(
          db, 'work_orders', id, organizationId, ['released', 'in_progress'],
          { status: 'completed', completed_quantity: finalQty, actual_completion_date: new Date().toISOString() },
          'id, work_order_number',
        );
        if (!updated) throw new Error('Work order status changed concurrently; please retry');

        return { id: wo.id, workOrderNumber: wo.work_order_number, status: 'completed', completedQuantity: finalQty };
      },
    }),
  };
}
