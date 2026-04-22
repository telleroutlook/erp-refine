import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { PRODUCT_STATUS_OPTIONS } from '../../../constants/options';

export const ProductCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建产品">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品编号" name="code" rules={[{ required: true, message: '请输入产品编号' }]}>
              <Input placeholder="如：PROD-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请输入产品名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="单位" name="uom">
              <Input placeholder="如：个、箱、公斤" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="active">
              <Select options={PRODUCT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
