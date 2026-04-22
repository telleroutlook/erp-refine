import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PAYMENT_RECORD_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const PaymentRecordList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'payment-records',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'payment_number', label: '付款编号', placeholder: '搜索付款编号' },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(PAYMENT_RECORD_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'payment_date', label: '付款日期' },
  ];

  return (
    <List title="付款记录">
      <ListFilters config={filterConfig} setFilters={setFilters} />
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
