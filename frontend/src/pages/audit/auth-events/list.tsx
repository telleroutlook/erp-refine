import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const AuthEventList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'auth-events',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.authEvents')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="event_type" title={fl('auth_events', 'event_type')} width={160} />
        <Table.Column dataIndex="user_id" title={fl('auth_events', 'user_id')} width={280} ellipsis />
        <Table.Column dataIndex="ip_address" title={fl('auth_events', 'ip_address')} width={140} />
        <Table.Column dataIndex="user_agent" title={fl('auth_events', 'user_agent')} ellipsis />
        <Table.Column dataIndex="created_at" title={fl('auth_events', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('auth-events', r.id)} />} />
      </Table>
    </List>
  );
};
