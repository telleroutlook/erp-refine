import React, { useState } from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BulkActionBar } from '../../../components/shared/BulkActionBar';
import { SHIPMENT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const SalesShipmentList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, push } = useNavigation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: 'sales-shipments',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'shipment_number', label: t('filters.shipmentNumber'), placeholder: 'SHP-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(SHIPMENT_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'shipment_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List title={t('menu.salesShipments')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <BulkActionBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        actions={[
          {
            key: 'createInvoice',
            label: t('buttons.createSalesInvoice'),
            icon: <FileTextOutlined />,
            onClick: () => push(`/finance/sales-invoices/create?createFrom=sales-shipment&sourceId=${selectedRowKeys[0]}`),
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
        <Table.Column dataIndex="shipment_number" title={fl('sales_shipments', 'shipment_number')} width={160} />
        <Table.Column dataIndex={['sales_order', 'order_number']} title={fl('sales_shipments', 'sales_order_id')} width={160} />
        <Table.Column dataIndex={['sales_order', 'customer', 'name']} title={fl('sales_orders', 'customer_id')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="shipment_date" title={fl('sales_shipments', 'shipment_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-shipments', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('sales-shipments', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
