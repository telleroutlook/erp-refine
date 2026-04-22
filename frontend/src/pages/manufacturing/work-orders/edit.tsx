import React, { useMemo } from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';
import { StatusTag } from '../../../components/shared/StatusTag';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';

const WO_MATERIAL_STATUS_OPTIONS = [
  { label: 'pending', value: 'pending' },
  { label: 'issued', value: 'issued' },
  { label: 'returned', value: 'returned' },
];

export const WorkOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'work-orders' });
  const record = queryResult?.data?.data as any;
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: w.name, value: w.id }));
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const materialColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: '物料', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'required_quantity', title: '需求数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'issued_quantity', title: '已领数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'status', title: '状态', width: 100, editable: true, inputType: 'select', selectOptions: WO_MATERIAL_STATUS_OPTIONS, render: (v: any) => <StatusTag status={v} /> },
    { dataIndex: 'notes', title: '备注', editable: true },
  ];

  const productionColumns: ColumnConfig[] = [
    { dataIndex: 'production_date', title: '报工日期', width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
    { dataIndex: 'quantity', title: '生产数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'qualified_quantity', title: '合格数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'defective_quantity', title: '不良数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'notes', title: '备注', editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑生产工单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label="工单号" name="work_order_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="状态" name="status"><Select options={WORK_ORDER_STATUS_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="计划数量" name="planned_quantity"><InputNumber style={FULL_WIDTH} min={1} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="仓库" name="warehouse_id"><Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="开始日期" name="start_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="计划完成日期" name="planned_completion_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="work-order-materials" parentResource="work-orders" parentId={record?.id} parentFk="work_order_id" items={record?.materials ?? []} columns={materialColumns} title="物料需求" productsMap={productsMap} />
      <EditableItemTable resource="work-order-productions" parentResource="work-orders" parentId={record?.id} parentFk="work_order_id" items={record?.productions ?? []} columns={productionColumns} title="生产报工" />
    </Edit>
  );
};
