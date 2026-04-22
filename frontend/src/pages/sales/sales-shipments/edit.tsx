import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { SHIPMENT_STATUS_OPTIONS } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const SalesShipmentEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'sales-shipments' });
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
    { dataIndex: 'quantity', title: '发货数量', width: 100, align: 'right', editable: true, inputType: 'number' },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售发货单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="发货单号" name="shipment_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={SHIPMENT_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="发货日期" name="shipment_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="sales-shipment-items" parentResource="sales-shipments" parentId={record?.id} parentFk="sales_shipment_id" items={record?.items ?? []} columns={itemColumns} title="发货行" />
    </Edit>
  );
};
