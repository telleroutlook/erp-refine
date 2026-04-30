import React, { useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { PO_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

export const PurchaseOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'purchase-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: fl('purchase_order_items', 'line_number'), width: 60 },
    { dataIndex: 'product_id', title: fl('purchase_order_items', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
    { dataIndex: 'quantity', title: fl('purchase_order_items', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('purchase_order_items', 'unit_price'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'amount', title: fl('purchase_order_items', 'line_total'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('purchase_orders', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_orders', 'order_number')} name="order_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(PO_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_orders', 'order_date')} name="order_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_orders', 'expected_date')} name="expected_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_orders', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_orders', 'payment_terms')} name="payment_terms"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.orderLines')} onChange={setItemsPayload} productsMap={productsMap} priceField="cost_price" />
    </Edit>
  );
};
