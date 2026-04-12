import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';

export const ProductCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建产品">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品编号" name="code" rules={[{ required: true, message: '请输入产品编号' }]}>
              <Input placeholder="如：PROD-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请输入产品名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="单位" name="uom">
              <Input placeholder="如：个、箱、公斤" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
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
