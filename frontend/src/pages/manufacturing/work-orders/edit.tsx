import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';

export const WorkOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-orders' });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: w.name, value: w.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑生产工单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="工单号" name="work_order_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={WORK_ORDER_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划数量" name="planned_quantity">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="开始日期" name="start_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划完成日期" name="planned_completion_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
