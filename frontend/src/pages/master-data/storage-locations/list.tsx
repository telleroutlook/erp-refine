import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const StorageLocationList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'storage-locations',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
    { type: 'entity', field: 'warehouse_id', label: t('filters.warehouse'), resource: 'warehouses' },
  ];

  return (
    <List
      title={t('menu.storageLocations')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('storage-locations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={t('menu.storageLocations')} width={120} />
        <Table.Column dataIndex="name" title={t('menu.storageLocations')} />
        <Table.Column dataIndex={['warehouse', 'name']} title={t('menu.storageLocations')} />
        <Table.Column dataIndex="zone" title={t('menu.storageLocations')} />
        <Table.Column
          dataIndex="is_active"
          title={t('menu.storageLocations')}
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('storage-locations', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('storage-locations', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
