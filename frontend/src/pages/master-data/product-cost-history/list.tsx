import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { COST_METHOD_OPTIONS, translateOptions } from '../../../constants/options';

export const ProductCostHistoryList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'product-cost-history',
    sorters: { initial: [{ field: 'effective_date', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
    { type: 'select', field: 'cost_method', label: fl('product_cost_history', 'cost_method'), options: translateOptions(COST_METHOD_OPTIONS, t, 'enums.costMethod') },
    { type: 'dateRange', field: 'effective_date', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.productCostHistory')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex="cost_method" title={fl('product_cost_history', 'cost_method')} width={140} />
        <Table.Column dataIndex="unit_cost" title={fl('product_cost_history', 'unit_cost')} width={120} align="right" />
        <Table.Column dataIndex="total_quantity" title={fl('product_cost_history', 'total_quantity')} width={120} align="right" />
        <Table.Column dataIndex="total_value" title={fl('product_cost_history', 'total_value')} width={120} align="right" />
        <Table.Column dataIndex="effective_date" title={fl('product_cost_history', 'effective_date')} width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="created_at" title={fl('product_cost_history', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('product-cost-history', r.id)} />} />
      </Table>
    </List>
  );
};
