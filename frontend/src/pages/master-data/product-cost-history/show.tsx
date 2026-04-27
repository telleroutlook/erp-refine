import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ProductCostHistoryShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'product-cost-history' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.productCostHistory')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'cost_method')}>{record?.cost_method}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'unit_cost')}>{record?.unit_cost}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'total_value')}>{record?.total_value}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'total_quantity')}>{record?.total_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'effective_date')}>{record?.effective_date ? <DateField value={record.effective_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'reference_type')}>{record?.reference_type ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'reference_id')}>{record?.reference_id ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('product_cost_history', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
