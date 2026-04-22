import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const UserRoleEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'user-roles' });
  const { selectProps: roleProps } = useSelect({ resource: 'roles', optionLabel: 'name', optionValue: 'id' });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('user_roles', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('user_roles', 'user_id')} name="user_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('user_roles', 'role_id')} name="role_id">
              <Select {...roleProps} showSearch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
