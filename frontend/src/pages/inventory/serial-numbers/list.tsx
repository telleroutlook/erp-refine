import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { SERIAL_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const SerialNumberList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const fl = useFieldLabel();

  const { tableProps, setFilters } = useTable({
    resource: 'serial-numbers',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'serial_number', label: t('filters.search'), placeholder: 'SN-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(SERIAL_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
  ];

  return (
    <List
      title={t('menu.serialNumbers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('serial-numbers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="serial_number" title={fl('serial_numbers', 'serial_number')} width={180} />
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('warehouses', 'name')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('serial-numbers', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('serial-numbers', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
