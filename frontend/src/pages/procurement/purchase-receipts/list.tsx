import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { RECEIPT_STATUS_OPTIONS } from '../../../constants/options';

export const PurchaseReceiptList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'purchase-receipts',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'receipt_number', label: t('filters.search'), placeholder: 'REC-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: RECEIPT_STATUS_OPTIONS },
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
    { type: 'dateRange', field: 'receipt_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List title={t('menu.purchaseReceipts')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="receipt_number" title="收货单号" width={160} />
        <Table.Column dataIndex={['purchase_order', 'order_number']} title="采购订单号" width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title="供应商" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="receipt_date" title="收货日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
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
