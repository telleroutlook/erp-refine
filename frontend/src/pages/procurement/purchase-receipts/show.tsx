import React from 'react';
import { useShow, useNavigation } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PurchaseReceiptShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'purchase-receipts' });
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
      onClick={() => push(`/finance/supplier-invoices/create?createFrom=purchase-receipt&sourceId=${record.id}`)}
    >
      {t('buttons.createSupplierInvoice', 'Create Supplier Invoice')}
    </Button>
  ) : undefined;

  return (
    <Show
      title={`${pt('purchase_receipts', 'show')} ${record?.receipt_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('purchase_receipts', 'receipt_number')}>{record?.receipt_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('purchase_receipts', 'purchase_order_id')}>{record?.purchase_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_receipts', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_receipts', 'receipt_date')}>
          <DateField value={record?.receipt_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.receiptLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('purchase_receipt_items', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('purchase_receipt_items', 'quantity'), width: 100, align: 'right' },
              { dataIndex: ['product', 'uom'], title: fl('products', 'uom'), width: 80 },
            ]}
          />
        </>
      )}
    </Show>
  );
};
