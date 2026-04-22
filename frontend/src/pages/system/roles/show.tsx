import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const RoleShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'roles' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.roles')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('roles', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('roles', 'is_system')}>{record?.is_system ? <Tag color="blue">{t('enums.yesNo.yes')}</Tag> : <Tag>{t('enums.yesNo.no')}</Tag>}</Descriptions.Item>
        <Descriptions.Item label={fl('roles', 'description')} span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={fl('roles', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
        <Descriptions.Item label={fl('roles', 'updated_at')}><DateField value={record?.updated_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
