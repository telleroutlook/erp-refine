import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'customers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('customers', 'show')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('customers', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('customers', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('customers', 'contact')}>{record?.contact}</Descriptions.Item>
        <Descriptions.Item label={fl('customers', 'phone')}>{record?.phone}</Descriptions.Item>
        <Descriptions.Item label={fl('customers', 'email')}>{record?.email}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
