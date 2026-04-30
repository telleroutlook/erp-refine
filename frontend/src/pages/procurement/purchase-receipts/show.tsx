import React from 'react';
import { useShow, useNavigation, useCustomMutation, useInvalidate } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Space, Popconfirm, message } from 'antd';
import { FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { API_URL } from '../../../constants/api';

export const PurchaseReceiptShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'purchase-receipts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const { mutate: doConfirm, isLoading: confirming } = useCustomMutation();
  const invalidate = useInvalidate();
  const record = queryResult.data?.data as any;

  const canConfirm = record?.status === 'draft';
  const canCreateInvoice = record?.status === 'confirmed';

  const handleConfirm = () => {
    doConfirm({
      url: `${API_URL}/purchase-receipts/${record.id}/confirm`,
      method: 'post',
      values: {},
    }, {
      onSuccess: (resp: any) => {
        const d = resp?.data?.data ?? {};
        message.success(t('messages.receiptConfirmed', {
          stock: d.stock_transactions_created ?? 0,
          inspections: d.inspections_created ?? 0,
          defaultValue: `Confirmed. Stock-in: ${d.stock_transactions_created ?? 0}, Inspections created: ${d.inspections_created ?? 0}`,
        }));
        invalidate({ resource: 'purchase-receipts', invalidates: ['detail', 'list'] });
      },
    });
  };

  const headerButtons = (
    <Space>
      {canConfirm && (
        <Popconfirm
          title={t('messages.confirmReceiptPrompt', 'Confirm this receipt? Stock-in and quality inspections will be created as needed.')}
          onConfirm={handleConfirm}
        >
          <Button type="primary" icon={<CheckCircleOutlined />} loading={confirming}>
            {t('buttons.confirmReceipt', 'Confirm Receipt')}
          </Button>
        </Popconfirm>
      )}
      {canCreateInvoice && (
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => push(`/finance/supplier-invoices/create?createFrom=purchase-receipt&sourceId=${record.id}`)}
        >
          {t('buttons.createSupplierInvoice', 'Create Supplier Invoice')}
        </Button>
      )}
    </Space>
  );

  return (
    <Show
      title={`${pt('purchase_receipts', 'show')} ${record?.receipt_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <DocumentFlowPanel objectType="purchase_receipt" objectId={record?.id} />
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
