import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerReceiptCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customer-receipts' });
  const { data: customersData } = useList({ resource: 'customers', pagination: { pageSize: 500 } });
  const customerOptions = (customersData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('customer_receipts', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'customer_id')} name="customer_id" rules={[{ required: true, message: '请选择客户' }]}>
              <Select options={customerOptions} showSearch optionFilterProp="label" placeholder="选择客户" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('customer_receipts', 'receipt_date')}
              name="receipt_date"
              rules={[{ required: true, message: '请选择收款日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.amount')} name="amount" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'payment_method')} name="payment_method">
              <Select
                options={[
                  { value: 'bank_transfer', label: t('status.bank_transfer') },
                  { value: 'cash', label: t('status.cash') },
                  { value: 'check', label: t('status.check') },
                ]}
                placeholder="选择收款方式"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'reference_type')} name="reference_type">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'reference_id')} name="reference_id">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
