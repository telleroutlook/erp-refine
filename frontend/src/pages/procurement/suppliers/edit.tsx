import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const SupplierEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'suppliers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑供应商">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="供应商编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="供应商名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系人" name="contact_person">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="电话" name="contact_phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="邮箱" name="contact_email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
                { label: '待审批', value: 'pending_approval' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="地址" name="address">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
