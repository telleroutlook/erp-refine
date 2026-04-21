import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const CustomerReceiptEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customer-receipts' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑客户收款">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="收款单号" name="receipt_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="收款方式" name="payment_method">
              <Select
                options={[
                  { value: 'bank_transfer', label: '银行转账' },
                  { value: 'cash', label: '现金' },
                  { value: 'check', label: '支票' },
                  { value: 'alipay', label: '支付宝' },
                  { value: 'wechat', label: '微信' },
                  { value: 'other', label: '其他' },
                ]}
              />
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
