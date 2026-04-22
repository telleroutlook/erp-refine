import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Row, Col } from 'antd';

export const DocumentRelationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'document-relations' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建单据关联">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="来源类型" name="from_object_type" rules={[{ required: true, message: '请输入来源类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="来源ID" name="from_object_id" rules={[{ required: true, message: '请输入来源ID' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="目标类型" name="to_object_type" rules={[{ required: true, message: '请输入目标类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="目标ID" name="to_object_id" rules={[{ required: true, message: '请输入目标ID' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="关联类型" name="relation_type" initialValue="reference">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="标签" name="label">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
