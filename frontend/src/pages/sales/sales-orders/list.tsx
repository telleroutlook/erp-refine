import React, { useState } from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, CarOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BulkActionBar } from '../../../components/shared/BulkActionBar';
import { SO_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const SalesOrderList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, push } = useNavigation();
  const fl = useFieldLabel();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: 'sales-orders',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'order_number', label: t('filters.orderNumber'), placeholder: 'SO-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(SO_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'customer_id', label: t('filters.customer'), resource: 'customers' },
    { type: 'dateRange', field: 'order_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  const bulkDropdownItems = [
    {
      key: 'createShipment',
      label: t('buttons.createSalesShipment'),
      icon: <CarOutlined />,
      onClick: () => push(`/sales/sales-shipments/create?createFrom=sales-order&sourceId=${selectedRowKeys[0]}`),
    },
    {
      key: 'createInvoice',
      label: t('buttons.createSalesInvoice'),
      icon: <FileTextOutlined />,
      onClick: () => push(`/finance/sales-invoices/create?createFrom=sales-order&sourceId=${selectedRowKeys[0]}`),
    },
  ];

  return (
    <List title={t('menu.salesOrders')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <BulkActionBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        actions={[]}
        dropdownActions={bulkDropdownItems}
      />
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      >
        <Table.Column dataIndex="order_number" title={fl('sales_orders', 'order_number')} width={160} />
        <Table.Column dataIndex={['customer', 'name']} title={fl('sales_orders', 'customer_id')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="order_date" title={t('common.date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="total_amount" title={t('common.amount')} width={140} align="right" render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />} />
        <Table.Column title={t('common.actions')} width={100} render={(_, r: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-orders', r.id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => edit('sales-orders', r.id)} />
          </Space>
        )} />
      </Table>
    </List>
  );
};
