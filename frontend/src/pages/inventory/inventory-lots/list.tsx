import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { LOT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const InventoryLotList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const fl = useFieldLabel();

  const { tableProps, setFilters } = useTable({
    resource: 'inventory-lots',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'lot_number', label: t('filters.search'), placeholder: 'LOT-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(LOT_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
  ];

  return (
    <List
      title={t('menu.inventoryLots')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('inventory-lots')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="lot_number" title={fl('inventory_lots', 'lot_number')} width={160} />
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('warehouses', 'name')} />
        <Table.Column dataIndex="quantity" title={fl('inventory_lots', 'quantity')} width={100} align="right" />
        <Table.Column dataIndex="manufacture_date" title={fl('inventory_lots', 'manufacture_date')} width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="expiry_date" title={fl('inventory_lots', 'expiry_date')} width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('inventory-lots', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('inventory-lots', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
