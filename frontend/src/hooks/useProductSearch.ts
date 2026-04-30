import { useMemo } from 'react';
import { useSelect } from '@refinedev/antd';
import type { ProductInfo } from '../components/shared/EditableItemTable';

interface UseProductSearchResult {
  selectProps: ReturnType<typeof useSelect>['selectProps'];
  productsMap: Map<string, ProductInfo>;
}

export function useProductSearch(): UseProductSearchResult {
  const { selectProps, query } = useSelect({
    resource: 'products',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
    pagination: { pageSize: 500 },
  });

  const productsMap = useMemo(() => {
    const m = new Map<string, ProductInfo>();
    (query?.data?.data ?? []).forEach((p: any) =>
      m.set(p.id, { id: p.id, code: p.code, name: p.name, uom: p.uom, cost_price: p.cost_price, sale_price: p.sale_price })
    );
    return m;
  }, [query?.data?.data]);

  return { selectProps, productsMap };
}
