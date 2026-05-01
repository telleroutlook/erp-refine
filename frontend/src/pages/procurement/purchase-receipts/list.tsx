import React, { useState } from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BulkActionBar } from '../../../components/shared/BulkActionBar';
import { RECEIPT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const PurchaseReceiptList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, push } = useNavigation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: 'purchase-receipts',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'receipt_number', label: t('filters.search'), placeholder: 'REC-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(RECEIPT_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
    { type: 'dateRange', field: 'receipt_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List title={t('menu.purchaseReceipts')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <BulkActionBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        actions={[
          {
            key: 'createInvoice',
            label: t('buttons.createSupplierInvoice'),
            icon: <FileTextOutlined />,
            onClick: () => { if (selectedRowKeys.length === 1) push(`/finance/supplier-invoices/create?createFrom=purchase-receipt&sourceId=${selectedRowKeys[0]}`); },
            disabled: selectedRowKeys.length !== 1,
          },
        ]}
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
        <Table.Column dataIndex="receipt_number" title={fl('purchase_receipts', 'receipt_number')} width={160} />
        <Table.Column dataIndex={['purchase_order', 'order_number']} title={fl('purchase_receipts', 'purchase_order_id')} width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title={fl('purchase_receipts', 'supplier_id')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="receipt_date" title={fl('purchase_receipts', 'receipt_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('purchase-receipts', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('purchase-receipts', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
