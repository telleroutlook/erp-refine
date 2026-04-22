import React, { useMemo } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { INVOICE_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierInvoiceEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'supplier-invoices' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('supplier_invoices', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'quantity', title: fl('supplier_invoices', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('supplier_invoices', 'unit_price'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'amount', title: fl('supplier_invoices', 'line_total'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('supplier_invoices', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_invoices', 'invoice_number')} name="invoice_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(INVOICE_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_invoices', 'invoice_date')} name="invoice_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_invoices', 'due_date')} name="due_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_invoices', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="supplier-invoice-items" parentResource="supplier-invoices" parentId={record?.id} parentFk="supplier_invoice_id" items={record?.items ?? []} columns={itemColumns} title={t('sections.invoiceLines')} productsMap={productsMap} priceField="cost_price" />
    </Edit>
  );
};
