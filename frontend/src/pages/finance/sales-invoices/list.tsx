import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { INVOICE_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const SalesInvoiceList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'sales-invoices',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'invoice_number', label: fl('sales_invoices', 'invoice_number'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(INVOICE_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'customer_id', label: fl('sales_invoices', 'customer_id'), resource: 'customers' },
    { type: 'dateRange', field: 'invoice_date', label: fl('sales_invoices', 'invoice_date') },
    { type: 'itemProduct', field: '_item_product_id', label: fl('sales_invoices', 'product_id'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List title={t('menu.salesInvoices')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="invoice_number" title={fl('sales_invoices', 'invoice_number')} width={160} />
        <Table.Column dataIndex={['customer', 'name']} title={fl('sales_invoices', 'customer_id')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="invoice_date" title={fl('sales_invoices', 'invoice_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="due_date" title={fl('sales_invoices', 'due_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-invoices', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('sales-invoices', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
