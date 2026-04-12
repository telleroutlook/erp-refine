import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';

export const WarehouseCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建仓库">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="仓库编号" name="code" rules={[{ required: true, message: '请输入仓库编号' }]}>
              <Input placeholder="如：WH-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库名称" name="name" rules={[{ required: true, message: '请输入仓库名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
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
    </Create>
  );
};
