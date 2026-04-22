import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const InventoryReservationShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-reservations' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('inventory_reservations', 'show', { name: record?.id?.slice(0, 8) ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'code')}>{record?.product?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'code')}>{record?.warehouse?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_reservations', 'reserved_quantity')}>{record?.reserved_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_reservations', 'reference_type')}>{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_reservations', 'reference_id')}>{record?.reference_id}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_reservations', 'expires_at')}>
          {record?.expires_at ? <DateField value={record.expires_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('common', 'created_at')}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('common', 'updated_at')}>
          {record?.updated_at ? <DateField value={record.updated_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
