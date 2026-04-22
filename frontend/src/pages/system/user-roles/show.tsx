import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const UserRoleShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'user-roles' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.userRoles')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('user_roles', 'user_id')}>{record?.user_id}</Descriptions.Item>
        <Descriptions.Item label={fl('user_roles', 'role_id')}>{record?.role?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('user_roles', 'assigned_by')}>{record?.assigned_by}</Descriptions.Item>
        <Descriptions.Item label={fl('user_roles', 'assigned_at')}><DateField value={record?.assigned_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
