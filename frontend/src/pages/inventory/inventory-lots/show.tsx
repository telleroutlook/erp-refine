import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const InventoryLotShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-lots' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('inventory_lots', 'show', { name: record?.lot_number ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('inventory_lots', 'lot_number')}>{record?.lot_number}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_lots', 'quantity')}>{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_lots', 'manufacture_date')}>
          {record?.manufacture_date ? <DateField value={record.manufacture_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('inventory_lots', 'expiry_date')}>
          {record?.expiry_date ? <DateField value={record.expiry_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
