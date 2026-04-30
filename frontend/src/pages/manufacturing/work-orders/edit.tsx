import React, { useState } from 'react';
import { useForm, Edit, DateField, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { WORK_ORDER_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { StatusTag } from '../../../components/shared/StatusTag';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

const WO_MATERIAL_STATUS_OPTIONS = [
  { label: 'pending', value: 'pending' },
  { label: 'issued', value: 'issued' },
  { label: 'returned', value: 'returned' },
];

export const WorkOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'work-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: warehouseSelectProps } = useSelect({ resource: 'warehouses', optionLabel: 'name' });
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const materialColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('work_order_materials', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
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

  const [materialsPayload, setMaterialsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const [productionsPayload, setProductionsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: { materials: materialsPayload, productions: productionsPayload } });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('work_orders', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'work_order_number')} name="work_order_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(WORK_ORDER_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'planned_quantity')} name="planned_quantity"><InputNumber style={FULL_WIDTH} min={1} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'warehouse_id')} name="warehouse_id"><Select {...warehouseSelectProps} showSearch allowClear /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'start_date')} name="start_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('work_orders', 'planned_completion_date')} name="planned_completion_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.materials ?? []} columns={materialColumns} title={t('sections.materialRequirements')} productsMap={productsMap} onChange={setMaterialsPayload} />
      <EditableItemTable items={record?.productions ?? []} columns={productionColumns} title={t('sections.productionReports')} onChange={setProductionsPayload} />
    </Edit>
  );
};
