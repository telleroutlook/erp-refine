import React from 'react';
import { useShow, useNavigation } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesShipmentShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'sales-shipments' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const record = queryResult.data?.data as any;

  const canCreateInvoice = record?.status === 'confirmed';

  const headerButtons = canCreateInvoice ? (
    <Button
      type="primary"
      icon={<FileTextOutlined />}
      onClick={() => push(`/finance/sales-invoices/create?createFrom=sales-shipment&sourceId=${record.id}`)}
    >
      {t('buttons.createSalesInvoice', 'Create Sales Invoice')}
    </Button>
  ) : undefined;

  return (
    <Show title={`${pt('sales_shipments', 'show')} ${record?.shipment_number ?? ''}`} isLoading={queryResult.isLoading} headerButtons={headerButtons}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('sales_shipments', 'shipment_number')}>{record?.shipment_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('sales_shipments', 'sales_order_id')}>{record?.sales_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label={fl('sales_orders', 'customer_id')}>{record?.sales_order?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('sales_shipments', 'shipment_date')}>
          <DateField value={record?.shipment_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.shipmentLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('sales_shipment_items', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('sales_shipment_items', 'quantity'), width: 100, align: 'right' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
