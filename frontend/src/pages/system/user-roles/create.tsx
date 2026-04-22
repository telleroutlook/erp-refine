import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const UserRoleCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'user-roles' });
  const { selectProps: roleProps } = useSelect({ resource: 'roles', optionLabel: 'name', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('user_roles', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('user_roles', 'user_id')} name="user_id" rules={[{ required: true, message: t('validation.required', { field: fl('user_roles', 'user_id') }) }]}>
              <Input  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('user_roles', 'role_id')} name="role_id" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('user_roles', 'role_id') }) }]}>
              <Select {...roleProps} showSearch  />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
