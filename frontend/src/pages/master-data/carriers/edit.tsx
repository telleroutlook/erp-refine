import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const CarrierEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'carriers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑承运商">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="类型" name="carrier_type">
              <Select>
                <Select.Option value="express">快递</Select.Option>
                <Select.Option value="freight">货运</Select.Option>
                <Select.Option value="ltl">LTL（零担）</Select.Option>
                <Select.Option value="ftl">FTL（整车）</Select.Option>
                <Select.Option value="ocean">海运</Select.Option>
                <Select.Option value="air">空运</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="联系人" name="contact">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="电话" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="快递单追踪URL模板"
              name="tracking_url_template"
              help="使用 {tracking_number} 作为运单号占位符"
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
