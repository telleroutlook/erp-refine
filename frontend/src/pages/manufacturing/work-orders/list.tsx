import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';

export const WorkOrderList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const { tableProps, setFilters } = useTable({
    resource: 'work-orders',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'work_order_number', label: t('filters.search'), placeholder: 'WO-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: WORK_ORDER_STATUS_OPTIONS },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
    { type: 'dateRange', field: 'start_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct') },
  ];

  return (
    <List
      title="生产工单"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('work-orders')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="work_order_number" title="工单号" width={160} />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column dataIndex="planned_quantity" title="计划数量" width={100} align="right" />
        <Table.Column dataIndex="completed_quantity" title="完成数量" width={100} align="right" />
        <Table.Column dataIndex="start_date" title="开始日期" width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="planned_completion_date" title="计划完成" width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(status) => <StatusTag status={status} />} />
        <Table.Column title={t('common.actions')} width={120} render={(_, record: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('work-orders', record.id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => edit('work-orders', record.id)} />
          </Space>
        )} />
      </Table>
    </List>
  );
};
