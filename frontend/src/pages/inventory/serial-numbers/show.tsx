import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SerialNumberShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'serial-numbers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('serial_numbers', 'show', { name: record?.serial_number ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('serial_numbers', 'serial_number')}>{record?.serial_number}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('common', 'created_at')}>
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
