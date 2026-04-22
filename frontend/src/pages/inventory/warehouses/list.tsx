import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const WarehouseList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const fl = useFieldLabel();

  const { tableProps, setFilters } = useTable({
    resource: 'warehouses',
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.warehouses')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('warehouses')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('warehouses', 'code')} width={140} />
        <Table.Column dataIndex="name" title={fl('warehouses', 'name')} />
        <Table.Column dataIndex="location" title={fl('warehouses', 'location')} />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('warehouses', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('warehouses', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
