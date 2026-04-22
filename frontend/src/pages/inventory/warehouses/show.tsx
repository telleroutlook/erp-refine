import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WarehouseShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'warehouses' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('warehouses', 'show', { name: record?.name ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('warehouses', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'location')}>{record?.location}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        {record?.type && <Descriptions.Item label={fl('warehouses', 'type')}>{record.type}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
