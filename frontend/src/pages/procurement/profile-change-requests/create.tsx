import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProfileChangeRequestCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'profile-change-requests' });
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('profile_change_requests', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'request_type')} name="request_type" rules={[{ required: true, message: t('validation.required_request_type') }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'change_request_id')} name="change_request_id" rules={[{ required: true, message: t('validation.required_change_request_id') }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'supplier_id')} name="supplier_id">
              <Select {...supplierSelectProps} showSearch placeholder={t('placeholder.select_supplier')} allowClear />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'before_data')} name="before_data">
              <Input.TextArea rows={4} placeholder={t('placeholder.json_format')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'after_data')} name="after_data">
              <Input.TextArea rows={4} placeholder={t('placeholder.json_format')} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
