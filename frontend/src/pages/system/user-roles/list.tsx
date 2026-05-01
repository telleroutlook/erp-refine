import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const UserRoleList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'user-roles',
    sorters: { initial: [{ field: 'assigned_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'assigned_at', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.userRoles')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('user-roles')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="user_id" title={fl('user_roles', 'user_id')} width={280} />
        <Table.Column dataIndex={['role', 'name']} title={fl('user_roles', 'role_id')} />
        <Table.Column dataIndex="assigned_by" title={fl('user_roles', 'assigned_by')} width={280} />
        <Table.Column dataIndex="assigned_at" title={fl('user_roles', 'assigned_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('user-roles', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('user-roles', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
