import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { CUSTOMER_RECEIPT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const CustomerReceiptList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'customer-receipts',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'receipt_number', label: t('filters.receiptNumber'), placeholder: 'CR-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(CUSTOMER_RECEIPT_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'customer_id', label: t('filters.customer'), resource: 'customers' },
    { type: 'dateRange', field: 'receipt_date', label: t('filters.dateRange') },
  ];

  return (
    <List
      title="客户收款"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('customer-receipts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="receipt_number" title="收款单号" width={160} />
        <Table.Column dataIndex={['customer', 'name']} title="客户" />
        <Table.Column dataIndex="receipt_date" title="收款日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="amount" title="金额" width={140} align="right" render={(v) => <AmountDisplay value={v} />} />
        <Table.Column dataIndex="payment_method" title="收款方式" width={120} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('customer-receipts', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('customer-receipts', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
