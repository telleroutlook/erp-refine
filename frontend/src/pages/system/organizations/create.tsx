import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const OrganizationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'organizations' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('organizations', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organizations', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('organizations', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organizations', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('organizations', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organizations', 'email')} name="email">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organizations', 'phone')} name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organizations', 'tax_number')} name="tax_number">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('organizations', 'address')} name="address">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
