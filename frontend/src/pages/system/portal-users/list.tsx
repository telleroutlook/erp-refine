import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PORTAL_USER_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const PortalUserList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'portal-users',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'username', label: t('filters.search') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(PORTAL_USER_STATUS_OPTIONS, t) },
  ];

  return (
    <List title={t('menu.portalUsers')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="username" title={fl('portal_users', 'username')} width={200} />
        <Table.Column dataIndex="role" title={fl('portal_users', 'role')} width={120} />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(v) => <StatusTag status={v} />} />
        <Table.Column dataIndex={['supplier', 'name']} title={fl('suppliers', 'name')} />
        <Table.Column dataIndex="last_login_at" title={fl('portal_users', 'last_login_at')} width={160} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'} />
        <Table.Column dataIndex="created_at" title={fl('portal_users', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('portal-users', r.id)} />} />
      </Table>
    </List>
  );
};
