import React from 'react';
import { useShow, useNavigation } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Space, Dropdown } from 'antd';
import { DownOutlined, InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PurchaseOrderShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const { queryResult } = useShow({ resource: 'purchase-orders' });
  const record = queryResult.data?.data as any;

  const canCreateFrom = record?.status === 'approved';

  const createFromItems = [
    {
      key: 'receipt',
      icon: <InboxOutlined />,
      label: t('buttons.createPurchaseReceipt', 'Create Purchase Receipt'),
      onClick: () => push(`/procurement/purchase-receipts/create?createFrom=purchase-order&sourceId=${record.id}`),
    },
    {
      key: 'invoice',
      icon: <FileTextOutlined />,
      label: t('buttons.createSupplierInvoice', 'Create Supplier Invoice'),
      onClick: () => push(`/finance/supplier-invoices/create?createFrom=purchase-order&sourceId=${record.id}`),
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
      title={`${pt('purchase_orders', 'show')} ${record?.order_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('purchase_orders', 'order_number')}>{record?.order_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('purchase_orders', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.date')}>
          <DateField value={record?.order_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
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
              { dataIndex: 'line_number', title: fl('purchase_order_items', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('purchase_order_items', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('purchase_order_items', 'quantity'), width: 80, align: 'right' },
              { dataIndex: 'received_quantity', title: t('fields.received_quantity', 'Received'), width: 80, align: 'right' },
              { dataIndex: 'invoiced_quantity', title: t('fields.invoiced_quantity', 'Invoiced'), width: 80, align: 'right' },
              { dataIndex: 'unit_price', title: fl('purchase_order_items', 'unit_price'), width: 100, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'amount', title: fl('purchase_order_items', 'line_total'), width: 120, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
      <DocumentFlowPanel objectType="purchase_order" objectId={record?.id} />
    </Show>
  );
};
