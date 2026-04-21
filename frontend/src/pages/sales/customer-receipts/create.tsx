import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';

export const CustomerReceiptCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customer-receipts' });
  const { data: customersData } = useList({ resource: 'customers', pagination: { pageSize: 500 } });
  const customerOptions = (customersData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建客户收款">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="客户" name="customer_id" rules={[{ required: true, message: '请选择客户' }]}>
              <Select options={customerOptions} showSearch optionFilterProp="label" placeholder="选择客户" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="收款日期"
              name="receipt_date"
              rules={[{ required: true, message: '请选择收款日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
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
                placeholder="选择收款方式"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联类型" name="reference_type">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联单号" name="reference_id">
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
