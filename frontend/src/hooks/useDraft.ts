// frontend/src/hooks/useDraft.ts
// Hook for managing a single AI draft — fetch, commit, discard, renew, update

import { useState, useCallback, useRef } from 'react';
import { useNotification, useInvalidate } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../constants/api';
import { getAuthHeaders } from '../providers/token';

export interface DraftSummary {
  title: string;
  subtitle: string;
  amount?: number;
  currency?: string;
  items_count?: number;
  key_fields: Array<{ label: string; value: string }>;
}

export interface DraftFull {
  id: string;
  organization_id: string;
  created_by: string;
  session_id: string;
  action_type: 'create' | 'update' | 'status_change';
  resource_type: string;
  target_id: string | null;
  content: Record<string, unknown>;
  original_content: Record<string, unknown> | null;
  tool_name: string;
  tool_args: Record<string, unknown>;
  summary: DraftSummary;
  status: 'pending' | 'committed' | 'discarded' | 'expired';
  expires_at: string;
  renewed_count: number;
  committed_record_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DraftCardData {
  draft_id: string;
  action_type: 'create' | 'update' | 'status_change';
  resource_type: string;
  summary: DraftSummary;
}

export interface CommitResult {
  recordId: string | null;
  resourceType: string;
  actionType: string;
}

export function useDraft(draftId: string | null) {
  const [draft, setDraft] = useState<DraftFull | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { open: notify } = useNotification();
  const { t } = useTranslation();
  const invalidate = useInvalidate();
  const tRef = useRef(t);
  tRef.current = t;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const fetchDraft = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/drafts/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setDraft(data);
      return data as DraftFull;
    } catch {
      notifyRef.current?.({ type: 'error', message: tRef.current('ai.draft.loadFailed') });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const commit = useCallback(async (contentOverride?: Record<string, unknown>): Promise<CommitResult | null> => {
    if (!draftId) return null;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/drafts/${draftId}/commit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: contentOverride }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
      }
      const { data } = await res.json();
      setDraft((prev) => prev ? { ...prev, status: 'committed' } : null);
      notifyRef.current?.({ type: 'success', message: tRef.current('ai.draft.commitSuccess') });
      invalidate({ resource: data.resourceType, invalidates: ['list', 'detail'] });
      return data as CommitResult;
    } catch (err) {
      notifyRef.current?.({ type: 'error', message: tRef.current('ai.draft.commitFailed', { error: (err as Error).message }) });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [draftId, invalidate]);

  const discard = useCallback(async () => {
    if (!draftId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/drafts/${draftId}/discard`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDraft((prev) => prev ? { ...prev, status: 'discarded' } : null);
      notifyRef.current?.({ type: 'success', message: tRef.current('ai.draft.discardSuccess') });
    } catch {
      notifyRef.current?.({ type: 'error', message: tRef.current('ai.draft.discardFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);

  const renew = useCallback(async () => {
    if (!draftId) return;
    try {
      const res = await fetch(`${API_URL}/drafts/${draftId}/renew`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setDraft((prev) => prev ? { ...prev, expires_at: data.expires_at, renewed_count: data.renewed_count } : null);
      notifyRef.current?.({ type: 'success', message: tRef.current('ai.draft.renewed') });
    } catch {
      notifyRef.current?.({ type: 'error', message: tRef.current('ai.draft.renewFailed') });
    }
  }, [draftId]);

  const update = useCallback(async (content: Record<string, unknown>) => {
    if (!draftId) return;
    try {
      const res = await fetch(`${API_URL}/drafts/${draftId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setDraft((prev) => prev ? { ...prev, content: data.content, updated_at: data.updated_at } : null);
    } catch {
      notifyRef.current?.({ type: 'error', message: tRef.current('ai.draft.updateFailed') });
    }
  }, [draftId]);

  return { draft, isLoading, fetchDraft, commit, discard, renew, update };
}
