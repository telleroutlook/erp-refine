import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PaymentRecordList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'payment-records',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List title="付款记录">
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="payment_number" title="付款编号" width={160} />
        <Table.Column
          dataIndex="payment_date"
          title="付款日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column dataIndex="payment_type" title="付款类型" />
        <Table.Column dataIndex="payment_method" title="付款方式" />
        <Table.Column
          dataIndex="amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, record: any) => <AmountDisplay value={v} currency={record.currency} />}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('payment-records', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
