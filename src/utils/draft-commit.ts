// src/utils/draft-commit.ts
// Engine for committing AI drafts — replays the tool with confirmed=true

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ToolSet } from 'ai';
import { ApiError } from './api-error';

export interface CommitDraftParams {
  db: SupabaseClient;
  draftId: string;
  organizationId: string;
  userId: string;
  contentOverride?: Record<string, unknown>;
  toolSet: ToolSet;
  waitUntil?: (p: PromiseLike<unknown>) => void;
}

export interface CommitResult {
  recordId: string | null;
  resourceType: string;
  actionType: string;
}

export async function commitDraft(params: CommitDraftParams): Promise<CommitResult> {
  const { db, draftId, organizationId, userId, contentOverride, toolSet, waitUntil } = params;

  const { data: draft, error: loadErr } = await db
    .from('ai_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .single();

  if (loadErr || !draft) {
    throw ApiError.notFound('ai_drafts', draftId);
  }
  if (draft.created_by !== userId) {
    throw ApiError.badRequest('Cannot commit another user\'s draft');
  }
  if (new Date(draft.expires_at) < new Date()) {
    await db.from('ai_drafts').update({ status: 'expired' }).eq('id', draftId);
    throw ApiError.invalidState('ai_drafts', 'expired', 'commit');
  }

  // CAS: atomically transition pending → committed to prevent double-commit
  const { data: locked, error: casErr } = await db
    .from('ai_drafts')
    .update({ status: 'committed', updated_at: new Date().toISOString() })
    .eq('id', draftId)
    .eq('status', 'pending')
    .select('id')
    .single();

  if (casErr || !locked) {
    throw ApiError.invalidState('ai_drafts', 'unknown', 'commit', undefined, 'Draft was already committed or discarded (concurrent modification)');
  }

  try {
    const toolArgs = { ...(draft.tool_args as Record<string, unknown>), confirmed: true };

    if (contentOverride) {
      mergeContentIntoArgs(toolArgs, contentOverride, draft.resource_type);
    }

    const tool = toolSet[draft.tool_name];
    if (!tool) {
      throw new Error(`Tool '${draft.tool_name}' not found in registry`);
    }

    const result = await (tool as { execute: (args: Record<string, unknown>, opts: unknown) => Promise<unknown> }).execute(toolArgs, {});
    const recordId = extractRecordId(result);

    await db.from('ai_drafts').update({
      committed_at: new Date().toISOString(),
      committed_record_id: recordId,
    }).eq('id', draftId);

    if (waitUntil) {
      waitUntil(db.from('business_events').insert({
        organization_id: organizationId,
        event_type: 'draft.committed',
        entity_type: draft.resource_type,
        entity_id: recordId ?? draftId,
        payload: { draft_id: draftId, tool_name: draft.tool_name, actor_id: userId },
        severity: 'info',
      }));
    }

    return { recordId, resourceType: draft.resource_type, actionType: draft.action_type };
  } catch (err) {
    // Rollback: set status back to pending so user can retry
    await db.from('ai_drafts').update({
      status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', draftId);
    throw err;
  }
}

function mergeContentIntoArgs(
  toolArgs: Record<string, unknown>,
  content: Record<string, unknown>,
  _resourceType: string,
): void {
  // Content structure: { header: {...}, items: [...] } or flat fields
  if (content.header && typeof content.header === 'object') {
    const header = content.header as Record<string, unknown>;
    for (const [key, value] of Object.entries(header)) {
      if (key === 'id' || key === 'organization_id' || key === 'created_at' || key === 'updated_at') continue;
      if (value !== undefined) toolArgs[key] = value;
    }
  }
  if (content.items && Array.isArray(content.items)) {
    toolArgs.items = content.items;
  }
  // Flat content (no header/items wrapper)
  if (!content.header && !content.items) {
    for (const [key, value] of Object.entries(content)) {
      if (key === 'id' || key === 'organization_id' || key === 'created_at' || key === 'updated_at') continue;
      if (value !== undefined) toolArgs[key] = value;
    }
  }
}

function extractRecordId(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as Record<string, unknown>;
  if (typeof r.id === 'string') return r.id;
  if (r.data && typeof r.data === 'object') {
    const d = r.data as Record<string, unknown>;
    if (typeof d.id === 'string') return d.id;
  }
  if (r.header && typeof r.header === 'object') {
    const h = r.header as Record<string, unknown>;
    if (typeof h.id === 'string') return h.id;
  }
  return null;
}
