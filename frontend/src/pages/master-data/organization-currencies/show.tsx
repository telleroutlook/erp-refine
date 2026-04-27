import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const OrganizationCurrencyShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'organization-currencies' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.organizationCurrencies')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('organization_currencies', 'currency_code')}>{record?.currency_code}</Descriptions.Item>
        <Descriptions.Item label={fl('organization_currencies', 'is_default')}>
          <Tag color={record?.is_default ? 'green' : 'default'}>{record?.is_default ? 'Yes' : 'No'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={fl('organization_currencies', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
