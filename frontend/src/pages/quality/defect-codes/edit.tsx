import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { DEFECT_SEVERITY_OPTIONS } from '../../../constants/options';

export const DefectCodeEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'defect-codes' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑缺陷代码">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="代码" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="分类" name="category">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="严重程度" name="severity">
              <Select options={DEFECT_SEVERITY_OPTIONS} placeholder="选择严重程度" />
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
