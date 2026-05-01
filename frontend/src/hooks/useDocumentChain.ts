import { useState, useEffect } from 'react';
import { API_URL } from '../constants/api';
import { getAccessToken } from '../providers/token';

export interface ChainNode {
  id: string;
  objectType: string;
  objectId: string;
  label: string;
  date: string | null;
  amount: number | null;
  status: string | null;
  isFocal: boolean;
}

export interface ChainEdge {
  id: string;
  fromObjectType: string;
  fromObjectId: string;
  toObjectType: string;
  toObjectId: string;
  label: string;
}

export interface DocumentChain {
  nodes: ChainNode[];
  edges: ChainEdge[];
}

export function useDocumentChain(objectType: string | null, objectId: string | null) {
  const [chain, setChain] = useState<DocumentChain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectType || !objectId) return;
    const controller = new AbortController();
    const token = getAccessToken();

    setIsLoading(true);
    setError(null);

    fetch(
      `${API_URL}/document-relations/chain/${encodeURIComponent(objectType)}/${encodeURIComponent(objectId)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      }
    )
      .then(r => (r.ok ? r.json() : r.json().then((e: any) => Promise.reject(e.detail ?? 'Failed'))))
      .then((json: any) => {
        if (!controller.signal.aborted) setChain(json.data);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setError(String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [objectType, objectId]);

  return { chain, isLoading, error };
}
