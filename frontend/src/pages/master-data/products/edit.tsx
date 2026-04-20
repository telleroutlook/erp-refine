import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑产品">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品编号" name="code" rules={[{ required: true, message: '请输入产品编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="产品名称" name="name" rules={[{ required: true, message: '请输入产品名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="单位" name="uom">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
                { label: '已停产', value: 'discontinued' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
