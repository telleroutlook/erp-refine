import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const OrganizationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'organizations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.organizations')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('organizations', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'email')}>{record?.email}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'phone')}>{record?.phone}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'address')} span={2}>{record?.address ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'tax_number')}>{record?.tax_number ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>{record?.status && <StatusTag status={record.status} />}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'plan')}>{record?.plan ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label={fl('organizations', 'updated_at')}><DateField value={record?.updated_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
