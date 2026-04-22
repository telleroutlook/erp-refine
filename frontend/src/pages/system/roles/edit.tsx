import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

export const RoleEdit: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'roles' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑角色">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="系统角色" name="is_system" valuePropName="checked">
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
    </Edit>
  );
};
