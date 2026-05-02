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
import { useFieldLabel } from '../../../hooks';

export const CustomerReceiptList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
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
      title={t('menu.customerReceipts')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('customer-receipts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="receipt_number" title={fl('customer_receipts', 'receipt_number')} width={160} />
        <Table.Column dataIndex={['customer', 'name']} title={fl('customer_receipts', 'customer_id')} />
        <Table.Column dataIndex="receipt_date" title={fl('customer_receipts', 'receipt_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="amount" title={fl('customer_receipts', 'amount')} width={140} align="right" render={(v) => <AmountDisplay value={v} />} />
        <Table.Column dataIndex="payment_method" title={fl('customer_receipts', 'payment_method')} width={120} render={(v) => v ? t(`enums.paymentMethod.${v}`, v) : '-'} />
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
