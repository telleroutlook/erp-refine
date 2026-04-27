import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const OrganizationUomShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'organization-uoms' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.organizationUoms')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('organization_uoms', 'uom_id')}>{record?.uom_name ?? record?.uom_id}</Descriptions.Item>
        <Descriptions.Item label={fl('organization_uoms', 'is_default')}>
          <Tag color={record?.is_default ? 'green' : 'default'}>{record?.is_default ? 'Yes' : 'No'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={fl('organization_uoms', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
