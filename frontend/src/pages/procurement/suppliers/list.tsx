import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const SupplierList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'suppliers',
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.suppliers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('suppliers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('suppliers', 'code')} width={140} />
        <Table.Column dataIndex="name" title={fl('suppliers', 'name')} />
        <Table.Column dataIndex="contact_person" title={fl('suppliers', 'contact_person')} width={120} />
        <Table.Column dataIndex="contact_phone" title={fl('suppliers', 'contact_phone')} width={140} />
        <Table.Column dataIndex="contact_email" title={fl('suppliers', 'contact_email')} width={180} />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('suppliers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('suppliers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
