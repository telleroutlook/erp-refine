import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { RESERVATION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const InventoryReservationList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'inventory-reservations',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(RESERVATION_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
    { type: 'entity', field: 'warehouse_id', label: t('filters.warehouse'), resource: 'warehouses' },
  ];

  return (
    <List
      title="库存预留"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('inventory-reservations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="reference_type" title="引用类型" width={120} />
        <Table.Column dataIndex="reference_id" title="引用ID" width={160} render={(v) => v?.slice(0, 8) ?? '-'} />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="reserved_quantity" title="预留数量" width={100} align="right" />
        <Table.Column dataIndex="expires_at" title="到期时间" width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('inventory-reservations', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('inventory-reservations', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
