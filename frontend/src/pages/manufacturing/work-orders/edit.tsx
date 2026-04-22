import React, { useMemo } from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { WORK_ORDER_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { StatusTag } from '../../../components/shared/StatusTag';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

const WO_MATERIAL_STATUS_OPTIONS = [
  { label: 'pending', value: 'pending' },
  { label: 'issued', value: 'issued' },
  { label: 'returned', value: 'returned' },
];

export const WorkOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'work-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: w.name, value: w.id }));
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const materialColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('work_order_materials', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'required_quantity', title: fl('work_order_materials', 'required_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'issued_quantity', title: fl('work_order_materials', 'issued_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'status', title: t('common.status'), width: 100, editable: true, inputType: 'select', selectOptions: WO_MATERIAL_STATUS_OPTIONS, render: (v: any) => <StatusTag status={v} /> },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  const productionColumns: ColumnConfig[] = [
    { dataIndex: 'production_date', title: fl('work_order_productions', 'production_date'), width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
    { dataIndex: 'quantity', title: fl('work_order_productions', 'quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'qualified_quantity', title: fl('work_order_productions', 'qualified_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'defective_quantity', title: fl('work_order_productions', 'defective_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('work_orders', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'work_order_number')} name="work_order_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(WORK_ORDER_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'planned_quantity')} name="planned_quantity"><InputNumber style={FULL_WIDTH} min={1} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'warehouse_id')} name="warehouse_id"><Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'start_date')} name="start_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'planned_completion_date')} name="planned_completion_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="work-order-materials" parentResource="work-orders" parentId={record?.id} parentFk="work_order_id" items={record?.materials ?? []} columns={materialColumns} title={t('sections.materialRequirements')} productsMap={productsMap} />
      <EditableItemTable resource="work-order-productions" parentResource="work-orders" parentId={record?.id} parentFk="work_order_id" items={record?.productions ?? []} columns={productionColumns} title={t('sections.productionReports')} />
    </Edit>
  );
};
