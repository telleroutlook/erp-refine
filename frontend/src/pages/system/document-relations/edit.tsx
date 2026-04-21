import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Row, Col } from 'antd';

export const DocumentRelationEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'document-relations' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑单据关联">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="来源类型" name="from_object_type">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="来源ID" name="from_object_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="目标类型" name="to_object_type">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="目标ID" name="to_object_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联类型" name="relation_type">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="标签" name="label">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
