import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const SupplierInvoiceShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'supplier-invoices' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.supplierInvoices')} ${record?.invoice_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('supplier_invoices', 'invoice_number')}>{record?.invoice_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('supplier_invoices', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('supplier_invoices', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('supplier_invoices', 'invoice_date')}>
          <DateField value={record?.invoice_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('supplier_invoices', 'due_date')}>
          <DateField value={record?.due_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.invoiceLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('supplier_invoices', 'product_id') },
              { dataIndex: 'quantity', title: fl('supplier_invoices', 'quantity'), width: 80, align: 'right' },
              { dataIndex: 'unit_price', title: fl('supplier_invoices', 'unit_price'), width: 100, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'amount', title: fl('supplier_invoices', 'line_total'), width: 120, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
      <DocumentFlowPanel objectType="supplier_invoice" objectId={record?.id} />
    </Show>
  );
};
