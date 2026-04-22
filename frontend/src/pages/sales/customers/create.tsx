import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('customers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customers', 'code')} name="code" rules={[{ required: true, message: '请输入客户编号' }]}>
              <Input placeholder="如：CUST-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customers', 'name')} name="name" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customers', 'contact')} name="contact">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customers', 'phone')} name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customers', 'email')} name="email" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="active">
              <Select options={[
                { label: t('status.active'), value: 'active' },
                { label: t('status.inactive'), value: 'inactive' },
                { label: t('status.suspended'), value: 'suspended' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
