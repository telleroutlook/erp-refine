import React from 'react';
import { useShow, useNavigation } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Dropdown, Space } from 'antd';
import { DownOutlined, CarOutlined, FileTextOutlined } from '@ant-design/icons';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesOrderShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'sales-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const record = queryResult.data?.data as any;

  const canCreateFrom = record?.status === 'approved';

  const createFromItems = [
    {
      key: 'shipment',
      icon: <CarOutlined />,
      label: t('buttons.createSalesShipment', 'Create Shipment'),
      onClick: () => push(`/sales/sales-shipments/create?createFrom=sales-order&sourceId=${record.id}`),
    },
    {
      key: 'invoice',
      icon: <FileTextOutlined />,
      label: t('buttons.createSalesInvoice', 'Create Sales Invoice'),
      onClick: () => push(`/finance/sales-invoices/create?createFrom=sales-order&sourceId=${record.id}`),
    },
  ];

  const headerButtons = canCreateFrom ? (
    <Dropdown menu={{ items: createFromItems }} trigger={['click']}>
      <Button type="primary">
        {t('buttons.createFromSource', 'Reference Create')} <DownOutlined />
      </Button>
    </Dropdown>
  ) : undefined;

  return (
    <Show
      title={`${pt('sales_orders', 'show')} ${record?.order_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <DocumentFlowPanel objectType="sales_order" objectId={record?.id} />
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('sales_orders', 'order_number')}>{record?.order_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('sales_orders', 'customer_id')}>{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.date')}>
          <DateField value={record?.order_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('sales_orders', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('sections.orderLines')}</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: fl('sales_order_items', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('sales_order_items', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('sales_order_items', 'quantity'), width: 80, align: 'right' },
              { dataIndex: 'shipped_quantity', title: t('fields.shipped_quantity', 'Shipped'), width: 80, align: 'right' },
              { dataIndex: 'invoiced_quantity', title: t('fields.invoiced_quantity', 'Invoiced'), width: 80, align: 'right' },
              { dataIndex: 'unit_price', title: fl('sales_order_items', 'unit_price'), width: 100, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'amount', title: fl('sales_order_items', 'line_total'), width: 120, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
