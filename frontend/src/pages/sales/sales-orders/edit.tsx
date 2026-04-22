import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { SO_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const SalesOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'sales-orders' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售订单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="订单号" name="order_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={SO_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="订单日期"
              name="order_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
