import React, { useMemo } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { REQUISITION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PurchaseRequisitionEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'purchase-requisitions' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: fl('purchase_requisition_lines', 'line_number'), width: 60 },
    { dataIndex: 'product_id', title: fl('purchase_requisition_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
    { dataIndex: 'quantity', title: fl('purchase_requisition_lines', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('purchase_requisition_lines', 'unit_price'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} /> },
    { dataIndex: 'amount', title: fl('purchase_requisition_lines', 'amount'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} /> },
    { dataIndex: ['suggested_supplier', 'name'], title: fl('purchase_requisition_lines', 'suggested_supplier_id'), width: 140 },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('purchase_requisitions', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_requisitions', 'requisition_number')} name="requisition_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(REQUISITION_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_requisitions', 'request_date')} name="request_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('purchase_requisitions', 'required_date')} name="required_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="purchase-requisition-lines" parentResource="purchase-requisitions" parentId={record?.id} parentFk="purchase_requisition_id" items={record?.lines ?? []} columns={itemColumns} title={t('sections.requisitionLines')} productsMap={productsMap} priceField="cost_price" />
    </Edit>
  );
};
