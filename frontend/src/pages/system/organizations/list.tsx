import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { ORGANIZATION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const OrganizationList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'organizations',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.search') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(ORGANIZATION_STATUS_OPTIONS, t) },
  ];

  return (
    <List
      title={t('menu.organizations')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('organizations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="name" title={fl('organizations', 'name')} />
        <Table.Column dataIndex="code" title={fl('organizations', 'code')} width={120} />
        <Table.Column dataIndex="email" title={fl('organizations', 'email')} width={200} />
        <Table.Column dataIndex="phone" title={fl('organizations', 'phone')} width={140} />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(v) => <StatusTag status={v} />} />
        <Table.Column dataIndex="created_at" title={fl('organizations', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={100} render={(_, record: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('organizations', record.id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => edit('organizations', record.id)} />
          </Space>
        )} />
      </Table>
    </List>
  );
};
