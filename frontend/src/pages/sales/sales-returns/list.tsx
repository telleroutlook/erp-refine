import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { RETURN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const SalesReturnList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'sales-returns',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'return_number', label: t('filters.returnNumber'), placeholder: 'SR-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(RETURN_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'customer_id', label: t('filters.customer'), resource: 'customers' },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List title={t('menu.salesReturns')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="return_number" title="退货单号" width={160} />
        <Table.Column dataIndex={['customer', 'name']} title="客户" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="return_date" title="退货日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, r: any) => <AmountDisplay value={v} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-returns', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('sales-returns', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
