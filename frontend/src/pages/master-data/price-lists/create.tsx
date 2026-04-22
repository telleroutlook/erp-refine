import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Switch, Row, Col } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

export const PriceListCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'price-lists' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建价格表">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生效日期"
              name="effective_from"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="effective_to"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="默认" name="is_default" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
