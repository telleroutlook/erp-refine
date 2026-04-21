import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PaymentRequestList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps } = useTable({
    resource: 'payment-requests',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.paymentRequests')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="request_number" title="申请单号" width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title="供应商" />
        <Table.Column dataIndex="currency" title={t('common.currency')} width={80} />
        <Table.Column
          dataIndex="amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />}
        />
        <Table.Column
          dataIndex="ok_to_pay_flag"
          title="可付款"
          width={90}
          render={(v) => <Tag color={v ? 'green' : 'orange'}>{v ? '是' : '否'}</Tag>}
        />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="created_at" title={t('common.date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('payment-requests', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('payment-requests', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
