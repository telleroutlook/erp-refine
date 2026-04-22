import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';

export const QualityStandardEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'quality-standards' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑质量标准">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="标准代码" name="standard_code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="标准名称" name="standard_name" rules={[{ required: true, message: '请输入标准名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
