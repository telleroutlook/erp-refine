// frontend/src/hooks/useCreateFrom.ts
// Hook for the "create from" (参考创建) workflow.
// Reads URL search params, fetches preview data from the backend.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../constants/api';

export interface CreateFromSource {
  id: string;
  type: string;
  number: string;
}

export interface CreateFromData {
  header: Record<string, unknown>;
  items: Array<Record<string, unknown> & { _open_quantity: number; _source_item_id: string; _product?: any }>;
  source: CreateFromSource;
}

export interface UseCreateFromResult {
  isCreateFrom: boolean;
  sourceData: CreateFromData | null;
  isLoading: boolean;
  error: string | null;
  sourceRef: { type: string; id: string } | null;
}

export function useCreateFrom(targetResource: string): UseCreateFromResult {
  const [searchParams] = useSearchParams();
  const createFrom = searchParams.get('createFrom');
  const sourceId = searchParams.get('sourceId');

  const [sourceData, setSourceData] = useState<CreateFromData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreateFrom = !!(createFrom && sourceId);

  useEffect(() => {
    if (!createFrom || !sourceId) return;

    const token = localStorage.getItem('access_token');
    const url = `${API_URL}/${targetResource}/create-from/${createFrom}/${sourceId}`;

    setIsLoading(true);
    setError(null);

    fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Failed to fetch: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        setSourceData(json.data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [createFrom, sourceId, targetResource]);

  return {
    isCreateFrom,
    sourceData,
    isLoading,
    error,
    sourceRef: isCreateFrom ? { type: createFrom!, id: sourceId! } : null,
  };
}
