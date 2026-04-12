import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { PO_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

const STATUS_OPTIONS = PO_STATUS_OPTIONS.slice(0, 3);

export const PurchaseOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'purchase-orders' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建采购订单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="订单号" name="order_number" rules={[{ required: true, message: '请输入订单号' }]}>
              <Input placeholder="如：PO-2026-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="订单日期"
              name="order_date"
              rules={[{ required: true, message: '请选择订单日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="预计到货日期"
              name="expected_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="付款条件（天）" name="payment_terms">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="运输方式" name="shipping_method">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
