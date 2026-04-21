import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { CUSTOMER_RECEIPT_STATUS_OPTIONS } from '../../../constants/options';

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
            <Form.Item label="状态" name="status">
              <Select options={CUSTOMER_RECEIPT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="收款日期"
              name="receipt_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="金额" name="amount">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="收款方式" name="payment_method">
              <Select
                options={[
                  { value: 'bank_transfer', label: '银行转账' },
                  { value: 'cash', label: '现金' },
                  { value: 'check', label: '支票' },
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
