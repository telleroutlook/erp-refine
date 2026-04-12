import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';

export const CustomerCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customers' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建客户">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="客户编号" name="code" rules={[{ required: true, message: '请输入客户编号' }]}>
              <Input placeholder="如：CUST-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="客户名称" name="name" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系人" name="contact_name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="电话" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="地址" name="address">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
