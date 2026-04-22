import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { TRANSACTION_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const StockTransactionList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const fl = useFieldLabel();

  const { tableProps, setFilters } = useTable({
    resource: 'stock-transactions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'select', field: 'transaction_type', label: t('filters.transactionType'), options: translateOptions(TRANSACTION_TYPE_OPTIONS, t, 'enums.transactionType') },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
    { type: 'entity', field: 'warehouse_id', label: t('filters.warehouse'), resource: 'warehouses' },
    { type: 'dateRange', field: 'transaction_date', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.stockTransactions')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="transaction_date" title={fl('stock_transactions', 'transaction_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('warehouses', 'name')} />
        <Table.Column dataIndex="transaction_type" title={fl('stock_transactions', 'transaction_type')} width={120} />
        <Table.Column dataIndex="quantity" title={fl('stock_transactions', 'quantity')} width={100} align="right" />
        <Table.Column dataIndex="reference_type" title={fl('stock_transactions', 'reference_type')} width={120} />
        <Table.Column dataIndex="reference_id" title={fl('stock_transactions', 'reference_id')} width={140} />
        <Table.Column
          title={t('common.actions')}
          width={60}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('stock-transactions', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
