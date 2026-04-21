// src/tools/quality-tools.ts
// Quality domain tools

import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createQualityTools(db: SupabaseClient, organizationId: string) {
  return {
    get_quality_inspection: tool({
      description: 'Get quality inspection detail with all inspection items',
      inputSchema: z.object({ id: z.string().uuid() }),
      execute: async ({ id }) => {
        const { data, error } = await db
          .from('quality_inspections')
          .select(`
            *, product:products(id,name,code), inspector:employees(id,name),
            items:quality_inspection_items(id,check_item,check_result,check_standard,measured_value,notes)
          `)
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    list_quality_standards: tool({
      description: 'List quality standards',
      inputSchema: z.object({
        status: z.enum(['active','inactive']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('quality_standards')
          .select('id, standard_code, standard_name, description, is_active')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status === 'active') query = query.eq('is_active', true);
        else if (status === 'inactive') query = query.eq('is_active', false);

        const { data, error } = await query.order('standard_code').limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_defect_codes: tool({
      description: 'List defect codes used in quality inspections',
      inputSchema: z.object({ search: z.string().optional() }),
      execute: async ({ search }) => {
        let query = db
          .from('defect_codes')
          .select('id, code, name, category, severity')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (search) {
          const s = search.replace(/[%_]/g, '');
          query = query.or(`code.ilike.%${s}%,name.ilike.%${s}%`);
        }

        const { data, error } = await query.order('code').limit(100);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    list_quality_inspections: tool({
      description: 'List quality inspections with optional filters',
      inputSchema: z.object({
        status: z.enum(['draft','in_progress','completed','cancelled']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      execute: async ({ status, limit }) => {
        let query = db
          .from('quality_inspections')
          .select('id, inspection_number, status, inspection_date, reference_type, reference_id, inspector:employees(id,name)')
          .eq('organization_id', organizationId)
          .is('deleted_at', null);

        if (status) query = query.eq('status', status);

        const { data, error } = await query.order('inspection_date', { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
    }),

    create_quality_inspection: tool({
      description: 'Create a new quality inspection with check items (requires D2 confirmation)',
      inputSchema: z.object({
        productId: z.string().uuid(),
        referenceType: z.string().describe('e.g. purchase_receipt, work_order'),
        referenceId: z.string().uuid(),
        inspectorId: z.string().uuid().optional(),
        inspectionDate: z.string().describe('ISO date string').optional(),
        totalQuantity: z.number().positive(),
        items: z.array(z.object({
          checkItem: z.string(),
          checkStandard: z.string().optional(),
        })),
        notes: z.string().optional(),
        confirmed: z.boolean().default(false).describe(
          'Set to true to execute. Omit or false returns a dry-run preview without writing to the database.'
        ),
      }),
      execute: async ({ productId, referenceType, referenceId, inspectorId, inspectionDate, totalQuantity, items, notes, confirmed }) => {
        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run preview — set confirmed=true to execute',
            productId,
            referenceType,
            referenceId,
            totalQuantity,
            checkItemCount: items.length,
          };
        }

        const { data: seqData, error: seqError } = await db.rpc('get_next_sequence', {
          p_organization_id: organizationId,
          p_sequence_name: 'quality_inspection',
        });
        if (seqError || !seqData) throw new Error(seqError?.message ?? 'Sequence unavailable');

        const { data: qi, error: qiErr } = await db
          .from('quality_inspections')
          .insert({
            organization_id: organizationId,
            inspection_number: seqData,
            product_id: productId,
            reference_type: referenceType,
            reference_id: referenceId,
            inspector_id: inspectorId ?? null,
            inspection_date: inspectionDate ?? new Date().toISOString().slice(0, 10),
            total_quantity: totalQuantity,
            qualified_quantity: 0,
            defective_quantity: 0,
            status: 'draft',
            notes: notes ?? null,
          })
          .select('id, inspection_number')
          .single();

        if (qiErr) throw new Error(qiErr.message);

        if (items.length > 0) {
          const checkItems = items.map(i => ({
            quality_inspection_id: qi.id,
            check_item: i.checkItem,
            check_standard: i.checkStandard ?? null,
          }));
          const { error: itemErr } = await db.from('quality_inspection_items').insert(checkItems);
          if (itemErr) {
            await db.from('quality_inspections').delete().eq('id', qi.id);
            throw new Error(itemErr.message);
          }
        }

        return { id: qi.id, inspectionNumber: qi.inspection_number, status: 'draft', checkItemCount: items.length };
      },
    }),

    complete_quality_inspection: tool({
      description: 'Complete a quality inspection with results (D3 — requires approval)',
      inputSchema: z.object({
        id: z.string().uuid(),
        result: z.enum(['pass', 'fail', 'conditional']).optional(),
        qualifiedQuantity: z.number().nonnegative().optional(),
        defectiveQuantity: z.number().nonnegative().optional(),
        confirmed: z.boolean().default(false).describe('Set to true to execute.'),
      }),
      execute: async ({ id, result, qualifiedQuantity, defectiveQuantity, confirmed }) => {
        const { data: qi, error } = await db
          .from('quality_inspections')
          .select('id, inspection_number, status, total_quantity')
          .eq('id', id)
          .eq('organization_id', organizationId)
          .is('deleted_at', null)
          .single();
        if (error || !qi) throw new Error('Quality inspection not found');
        if (!['draft', 'in_progress'].includes(qi.status)) {
          throw new Error(`Cannot complete inspection in status '${qi.status}'`);
        }

        if (!confirmed) {
          return {
            preview: true,
            message: 'Dry-run — set confirmed=true to complete',
            id: qi.id,
            inspectionNumber: qi.inspection_number,
            totalQuantity: qi.total_quantity,
            result: result ?? 'pending',
          };
        }

        const updatePayload: Record<string, unknown> = {
          status: 'completed',
          completed_at: new Date().toISOString(),
        };
        if (result) updatePayload.result = result;
        if (qualifiedQuantity !== undefined) updatePayload.qualified_quantity = qualifiedQuantity;
        if (defectiveQuantity !== undefined) updatePayload.defective_quantity = defectiveQuantity;

        const { error: updateErr } = await db
          .from('quality_inspections')
          .update(updatePayload)
          .eq('id', id)
          .eq('organization_id', organizationId);
        if (updateErr) throw new Error(updateErr.message);

        return { id: qi.id, inspectionNumber: qi.inspection_number, status: 'completed', result: result ?? null };
      },
    }),
  };
}
