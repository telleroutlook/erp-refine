import { useMemo } from 'react';
import { useSelect } from '@refinedev/antd';
import type { ProductInfo } from '../components/shared/EditableItemTable';

interface UseProductSearchResult {
  selectProps: ReturnType<typeof useSelect>['selectProps'];
  productsMap: Map<string, ProductInfo>;
}

export function useProductSearch(): UseProductSearchResult {
  const { selectProps, queryResult } = useSelect({
    resource: 'products',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });

  const productsMap = useMemo(() => {
    const m = new Map<string, ProductInfo>();
    (queryResult?.data?.data ?? []).forEach((p: any) =>
      m.set(p.id, { id: p.id, code: p.code, name: p.name, uom: p.uom, cost_price: p.cost_price, sale_price: p.sale_price })
    );
    return m;
  }, [queryResult?.data?.data]);

  return { selectProps, productsMap };
}
