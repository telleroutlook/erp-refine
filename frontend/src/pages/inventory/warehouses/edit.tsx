import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';

export const WarehouseEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑仓库">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="仓库编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
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
