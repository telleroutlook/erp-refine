import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PurchaseOrderList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps } = useTable({
    resource: 'purchase-orders',
    filters: {
      permanent: [{ field: 'deleted_at', operator: 'null', value: true }],
    },
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List title={t('menu.purchaseOrders')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="order_number" title="订单号" width={160} />
        <Table.Column
          dataIndex={['supplier', 'name']}
          title="供应商"
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          dataIndex="order_date"
          title={t('common.date')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, record: any) => <AmountDisplay value={v} currency={record.currency} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('purchase-orders', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('purchase-orders', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
