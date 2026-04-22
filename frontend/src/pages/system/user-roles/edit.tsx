import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

export const UserRoleEdit: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'user-roles' });
  const { selectProps: roleProps } = useSelect({ resource: 'roles', optionLabel: 'name', optionValue: 'id' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑用户角色">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="用户ID" name="user_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="角色" name="role_id">
              <Select {...roleProps} showSearch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
