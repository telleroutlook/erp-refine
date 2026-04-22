import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { COUNT_STATUS_OPTIONS } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const InventoryCountEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'inventory-counts' });
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'system_quantity', title: '系统数量', width: 100, align: 'right' },
    { dataIndex: 'counted_quantity', title: '盘点数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'variance_quantity', title: '差异数量', width: 100, align: 'right' },
    { dataIndex: 'notes', title: '备注', editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑库存盘点">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="盘点单号" name="count_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={COUNT_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="盘点日期" name="count_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="inventory-count-lines" parentResource="inventory-counts" parentId={record?.id} parentFk="inventory_count_id" items={record?.lines ?? []} columns={lineColumns} title="盘点明细" />
    </Edit>
  );
};
