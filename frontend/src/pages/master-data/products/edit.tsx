import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { PRODUCT_STATUS_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑产品">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品编号" name="code" rules={[{ required: true, message: '请输入产品编号' }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请输入产品名称' }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="单位" name="uom"><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={PRODUCT_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="采购价" name="cost_price"><InputNumber style={FULL_WIDTH} min={0} precision={2} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="销售价" name="sale_price"><InputNumber style={FULL_WIDTH} min={0} precision={2} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
