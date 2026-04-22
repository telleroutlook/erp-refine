import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

export const UserRoleCreate: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'user-roles' });
  const { selectProps: roleProps } = useSelect({ resource: 'roles', optionLabel: 'name', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title="分配用户角色">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="用户ID" name="user_id" rules={[{ required: true, message: '请输入用户ID' }]}>
              <Input placeholder="输入用户ID" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="角色" name="role_id" rules={[{ required: true, message: '请选择角色' }]}>
              <Select {...roleProps} showSearch placeholder="选择角色" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
