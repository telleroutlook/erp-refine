import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const RoleCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'roles' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('roles', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('roles', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('roles', 'name') }) }]}>
              <Input  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('roles', 'is_system')} name="is_system" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('roles', 'description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
