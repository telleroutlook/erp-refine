import React from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

const STATUS_OPTIONS = WORK_ORDER_STATUS_OPTIONS.slice(0, 2);

export const WorkOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-orders' });
  const { selectProps: productSelectProps } = useSelect({ resource: 'products', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: bomSelectProps } = useSelect({ resource: 'bom-headers', optionLabel: 'bom_number', optionValue: 'id' });
  const { selectProps: warehouseSelectProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建生产工单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select {...productSelectProps} showSearch placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="物料清单" name="bom_header_id">
              <Select {...bomSelectProps} showSearch placeholder="选择BOM" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划数量" name="planned_quantity" rules={[{ required: true, message: '请输入计划数量' }]}>
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="开始日期" name="start_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划完成日期" name="planned_completion_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch placeholder="选择仓库" allowClear />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
