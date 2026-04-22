import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const WorkOrderProductionList: React.FC = () => {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const fl = useFieldLabel();
  const { tableProps, setFilters } = useTable({
    resource: 'work-order-productions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.workOrderProductions')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('work-order-productions')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex={['work_order', 'work_order_number']} title={fl('work_orders', 'work_order_number')} width={160} />
        <Table.Column dataIndex="production_date" title={fl('work_order_productions', 'production_date')} width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="quantity" title={fl('work_order_productions', 'quantity')} width={100} align="right" />
        <Table.Column dataIndex="qualified_quantity" title={fl('work_order_productions', 'qualified_quantity')} width={100} align="right" />
        <Table.Column dataIndex="defective_quantity" title={fl('work_order_productions', 'defective_quantity')} width={100} align="right" />
        <Table.Column dataIndex="notes" title={t('common.notes')} ellipsis />
        <Table.Column title={t('common.actions')} width={80} render={(_, record: any) => (
          <Button size="small" icon={<EyeOutlined />} onClick={() => show('work-order-productions', record.id)} />
        )} />
      </Table>
    </List>
  );
};
