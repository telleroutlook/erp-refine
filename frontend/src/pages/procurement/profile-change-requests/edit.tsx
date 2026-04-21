import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

const STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已批准', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
];

export const ProfileChangeRequestEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'profile-change-requests' });
  const { data: suppliersData } = useList({ resource: 'suppliers', pagination: { pageSize: 500 } });
  const supplierOptions = (suppliersData?.data ?? []).map((s: any) => ({ label: `${s.code} - ${s.name}`, value: s.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑变更申请">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="变更申请编号" name="change_request_id">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="申请类型" name="request_type" rules={[{ required: true, message: '请输入申请类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="供应商" name="supplier_id">
              <Select options={supplierOptions} showSearch optionFilterProp="label" placeholder="选择供应商" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={STATUS_OPTIONS} />
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
    </Edit>
  );
};
