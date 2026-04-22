import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'suppliers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('suppliers', 'show')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('suppliers', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('suppliers', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('suppliers', 'contact_person')}>{record?.contact_person}</Descriptions.Item>
        <Descriptions.Item label={fl('suppliers', 'contact_phone')}>{record?.contact_phone}</Descriptions.Item>
        <Descriptions.Item label={fl('suppliers', 'contact_email')}>{record?.contact_email}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
