import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const CarrierCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'carriers' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建承运商">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入承运商编号' }]}>
              <Input placeholder="如：SF-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入承运商名称' }]}>
              <Input placeholder="如：顺丰速运" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="类型" name="carrier_type" initialValue="express">
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
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="快递单追踪URL模板"
              name="tracking_url_template"
              help="使用 {tracking_number} 作为运单号占位符，如：https://track.sf-express.com/{tracking_number}"
            >
              <Input placeholder="https://example.com/track/{tracking_number}" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
