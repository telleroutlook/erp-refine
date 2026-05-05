import React, { useState } from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Dropdown } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined, InboxOutlined, FileTextOutlined, DownOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BulkActionBar } from '../../../components/shared/BulkActionBar';
import { PO_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const PurchaseOrderList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create, push } = useNavigation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: 'purchase-orders',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'order_number', label: t('filters.orderNumber'), placeholder: 'PO-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(PO_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
    { type: 'dateRange', field: 'order_date', label: t('filters.dateRange') },
    { type: 'select', field: 'currency', label: t('filters.currency'), options: CURRENCY_OPTIONS },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  const bulkDropdownItems = [
    {
      key: 'createReceipt',
      label: t('buttons.createPurchaseReceipt'),
      icon: <InboxOutlined />,
      disabled: selectedRowKeys.length !== 1,
      onClick: () => { if (selectedRowKeys.length === 1) push(`/procurement/purchase-receipts/create?createFrom=purchase-order&sourceId=${selectedRowKeys[0]}`); },
    },
    {
      key: 'createInvoice',
      label: t('buttons.createSupplierInvoice'),
      icon: <FileTextOutlined />,
      disabled: selectedRowKeys.length !== 1,
      onClick: () => { if (selectedRowKeys.length === 1) push(`/finance/supplier-invoices/create?createFrom=purchase-order&sourceId=${selectedRowKeys[0]}`); },
    },
  ];

  return (
    <List
      title={t('menu.purchaseOrders')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('purchase-orders')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <BulkActionBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        actions={[
          {
            key: 'createFrom',
            label: t('buttons.createFromSource'),
            icon: <DownOutlined />,
            onClick: () => {},
          },
        ]}
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
        <Table.Column dataIndex="order_number" title={fl('purchase_orders', 'order_number')} width={160} />
        <Table.Column
          dataIndex={['supplier', 'name']}
          title={fl('purchase_orders', 'supplier_id')}
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

export default PurchaseOrderList;
