import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProfileChangeRequestEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'profile-change-requests' });
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('profile_change_requests', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'change_request_id')} name="change_request_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'request_type')} name="request_type" rules={[{ required: true, message: t('validation.required_request_type') }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'supplier_id')} name="supplier_id">
              <Select {...supplierSelectProps} showSearch placeholder={t('placeholder.select_supplier')} allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={[
                { label: t('status.draft'), value: 'draft' },
                { label: t('status.submitted'), value: 'submitted' },
                { label: t('status.approved'), value: 'approved' },
                { label: t('status.rejected'), value: 'rejected' },
                { label: t('status.cancelled'), value: 'cancelled' },
              ]} />
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
    </Edit>
  );
};
