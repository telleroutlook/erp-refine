import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { PAYMENT_REQUEST_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const PaymentRequestEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'payment-requests' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑付款申请">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="申请单号" name="request_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={PAYMENT_REQUEST_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="可付款" name="ok_to_pay_flag" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
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
