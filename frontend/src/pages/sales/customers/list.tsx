import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const CustomerList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'customers',
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.customers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('customers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('customers', 'code')} width={140} />
        <Table.Column dataIndex="name" title={fl('customers', 'name')} />
        <Table.Column dataIndex="contact" title={fl('customers', 'contact')} width={120} />
        <Table.Column dataIndex="phone" title={fl('customers', 'phone')} width={140} />
        <Table.Column dataIndex="email" title={fl('customers', 'email')} width={180} />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('customers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('customers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
