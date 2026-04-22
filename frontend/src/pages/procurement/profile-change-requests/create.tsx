import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProfileChangeRequestCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'profile-change-requests' });
  const { data: suppliersData } = useList({ resource: 'suppliers', pagination: { pageSize: 500 } });
  const supplierOptions = (suppliersData?.data ?? []).map((s: any) => ({ label: `${s.code} - ${s.name}`, value: s.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('profile_change_requests', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'request_type')} name="request_type" rules={[{ required: true, message: '请输入申请类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('profile_change_requests', 'change_request_id')} name="change_request_id" rules={[{ required: true, message: '请输入变更申请编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'supplier_id')} name="supplier_id">
              <Select options={supplierOptions} showSearch optionFilterProp="label" placeholder="选择供应商" allowClear />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'before_data')} name="before_data">
              <Input.TextArea rows={4} placeholder="JSON 格式" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('profile_change_requests', 'after_data')} name="after_data">
              <Input.TextArea rows={4} placeholder="JSON 格式" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
