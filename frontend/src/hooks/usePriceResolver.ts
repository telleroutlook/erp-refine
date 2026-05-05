import { useCallback, useRef } from 'react';
import { API_URL } from '../constants/api';

export interface PriceResolveParams {
  product_id: string;
  price_type: 'sales' | 'purchase';
  partner_id?: string;
  partner_type?: 'customer' | 'supplier';
  quantity?: number;
  uom_id?: string;
  date?: string;
  currency?: string;
}

export interface PriceResolveResult {
  found: boolean;
  unit_price: number;
  base_unit_price: number;
  discount_rate: number;
  net_price: number;
  price_list_id: string | null;
  price_list_code: string | null;
  price_list_name: string | null;
  currency: string | null;
  min_quantity: number;
  uom_conversion_factor: number;
  source: 'price_list' | 'product_master';
}

export function usePriceResolver() {
  const abortRef = useRef<AbortController | null>(null);

  const resolvePrice = useCallback(async (params: PriceResolveParams): Promise<PriceResolveResult | null> => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/pricing/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const json = await res.json();
      return json.data as PriceResolveResult;
    } catch {
      return null;
    }
  }, []);

  const resolveBatch = useCallback(async (
    items: { product_id: string; quantity?: number; uom_id?: string }[],
    params: Omit<PriceResolveParams, 'product_id' | 'quantity' | 'uom_id'>
  ): Promise<(PriceResolveResult & { product_id: string })[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/pricing/resolve-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items, ...params }),
      });

      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  return { resolvePrice, resolveBatch };
}
