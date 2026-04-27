import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const PortalUserShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'portal-users' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.portalUsers')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('portal_users', 'username')}>{record?.username}</Descriptions.Item>
        <Descriptions.Item label={fl('portal_users', 'role')}>{record?.role}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>{record?.status && <StatusTag status={record.status} />}</Descriptions.Item>
        <Descriptions.Item label={fl('suppliers', 'name')}>{record?.supplier?.name ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('portal_users', 'last_login_at')}>{record?.last_login_at ? <DateField value={record.last_login_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('portal_users', 'password_changed_at')}>{record?.password_changed_at ? <DateField value={record.password_changed_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('portal_users', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label={fl('portal_users', 'updated_at')}><DateField value={record?.updated_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
