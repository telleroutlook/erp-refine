import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { COUNT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const InventoryCountList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const fl = useFieldLabel();

  const { tableProps, setFilters } = useTable({
    resource: 'inventory-counts',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'count_number', label: t('filters.search'), placeholder: 'CNT-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(COUNT_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'warehouse_id', label: t('filters.warehouse'), resource: 'warehouses' },
    { type: 'dateRange', field: 'count_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List
      title={t('menu.inventoryCounts')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('inventory-counts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="count_number" title={fl('inventory_counts', 'count_number')} width={160} />
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('warehouses', 'name')} />
        <Table.Column dataIndex="count_date" title={fl('inventory_counts', 'count_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('inventory-counts', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('inventory-counts', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
