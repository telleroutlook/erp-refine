import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const CustomerEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑客户">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="客户编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="客户名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系人" name="contact">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="电话" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="邮箱" name="email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
                { label: '暂停', value: 'suspended' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
