// frontend/src/hooks/useDraft.ts
// Hook for managing a single AI draft — fetch, commit, discard, renew, update

import { useState, useCallback } from 'react';
import { useNotification, useInvalidate } from '@refinedev/core';
import { API_URL } from '../constants/api';

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

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export function useDraft(draftId: string | null) {
  const [draft, setDraft] = useState<DraftFull | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { open: notify } = useNotification();
  const invalidate = useInvalidate();

  const fetchDraft = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/drafts/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setDraft(data);
      return data as DraftFull;
    } catch (err) {
      notify?.({ type: 'error', message: 'Failed to load draft' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

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
      notify?.({ type: 'success', message: 'Draft committed successfully' });
      invalidate({ resource: data.resourceType, invalidates: ['list', 'detail'] });
      return data as CommitResult;
    } catch (err) {
      notify?.({ type: 'error', message: `Commit failed: ${(err as Error).message}` });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [draftId, notify, invalidate]);

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
      notify?.({ type: 'success', message: 'Draft discarded' });
    } catch {
      notify?.({ type: 'error', message: 'Failed to discard draft' });
    } finally {
      setIsLoading(false);
    }
  }, [draftId, notify]);

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
      notify?.({ type: 'success', message: 'Draft renewed for 24 hours' });
    } catch {
      notify?.({ type: 'error', message: 'Failed to renew draft' });
    }
  }, [draftId, notify]);

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
      notify?.({ type: 'error', message: 'Failed to update draft' });
    }
  }, [draftId, notify]);

  return { draft, isLoading, fetchDraft, commit, discard, renew, update };
}
