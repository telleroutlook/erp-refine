import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const SalesOrderList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'sales-orders',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.salesOrders')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="order_number" title="订单号" width={160} />
        <Table.Column dataIndex={['customer', 'name']} title="客户" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="order_date" title={t('common.date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="total_amount" title={t('common.amount')} width={140} align="right" render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />} />
        <Table.Column title={t('common.actions')} width={80} render={(_, r: any) => (
          <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-orders', r.id)} />
        )} />
      </Table>
    </List>
  );
};
