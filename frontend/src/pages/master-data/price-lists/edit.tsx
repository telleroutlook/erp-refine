import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Switch, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS, PRICE_LIST_STATUS_OPTIONS } from '../../../constants/options';

export const PriceListEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'price-lists' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑价格表">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="编号" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生效日期"
              name="effective_from"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="effective_to"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="默认" name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={PRICE_LIST_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
