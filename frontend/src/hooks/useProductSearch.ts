import { useMemo, useRef } from 'react';
import { useSelect } from '@refinedev/antd';
import type { CrudFilter } from '@refinedev/core';
import type { ProductInfo } from '../components/shared/EditableItemTable';

interface UseProductSearchResult {
  selectProps: ReturnType<typeof useSelect>['selectProps'];
  productsMap: Map<string, ProductInfo>;
}

export function useProductSearch(): UseProductSearchResult {
  const cacheRef = useRef(new Map<string, ProductInfo>());

  const { selectProps, query } = useSelect({
    resource: 'products',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
    pagination: { pageSize: 50 },
    debounce: 300,
    onSearch: (value): CrudFilter[] => {
      if (!value) return [];
      return [{ field: 'name', operator: 'contains', value }];
    },
  });

  const productsMap = useMemo(() => {
    const items = query?.data?.data ?? [];
    for (const p of items as any[]) {
      if (p.id && !cacheRef.current.has(p.id)) {
        cacheRef.current.set(p.id, {
          id: p.id, code: p.code, name: p.name,
          uom: p.uom, cost_price: p.cost_price, sale_price: p.sale_price,
        });
      }
    }
    return new Map(cacheRef.current);
  }, [query?.data?.data]);

  return { selectProps, productsMap };
}
