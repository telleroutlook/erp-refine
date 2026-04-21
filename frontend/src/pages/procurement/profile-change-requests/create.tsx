import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';

export const ProfileChangeRequestCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'profile-change-requests' });
  const { data: suppliersData } = useList({ resource: 'suppliers', pagination: { pageSize: 500 } });
  const supplierOptions = (suppliersData?.data ?? []).map((s: any) => ({ label: `${s.code} - ${s.name}`, value: s.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建变更申请">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="申请类型" name="request_type" rules={[{ required: true, message: '请输入申请类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="变更申请编号" name="change_request_id" rules={[{ required: true, message: '请输入变更申请编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="供应商" name="supplier_id">
              <Select options={supplierOptions} showSearch optionFilterProp="label" placeholder="选择供应商" allowClear />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="变更前数据" name="before_data">
              <Input.TextArea rows={4} placeholder="JSON 格式" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="变更后数据" name="after_data">
              <Input.TextArea rows={4} placeholder="JSON 格式" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
