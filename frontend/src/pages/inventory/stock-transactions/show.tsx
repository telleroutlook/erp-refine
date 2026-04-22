import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const StockTransactionShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'stock-transactions' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('stock_transactions', 'show')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={t('common.date')}>
          <DateField value={record?.transaction_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('stock_transactions', 'transaction_type')}>{record?.transaction_type}</Descriptions.Item>
        <Descriptions.Item label={fl('stock_transactions', 'quantity')}>{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('stock_transactions', 'reference_type')}>{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label={fl('stock_transactions', 'reference_id')}>{record?.reference_id}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
        <Descriptions.Item label={fl('common', 'created_by')}>{record?.created_by}</Descriptions.Item>
        <Descriptions.Item label={fl('common', 'created_at')}>
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
