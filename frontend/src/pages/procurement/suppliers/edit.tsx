import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'suppliers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('suppliers', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('suppliers', 'code')} name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('suppliers', 'name')} name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('suppliers', 'contact_person')} name="contact_person">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('suppliers', 'contact_phone')} name="contact_phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('suppliers', 'contact_email')} name="contact_email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={[
                { label: t('status.active'), value: 'active' },
                { label: t('status.inactive'), value: 'inactive' },
                { label: t('status.pending_approval'), value: 'pending_approval' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
