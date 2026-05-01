import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { PAYMENT_METHOD_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerReceiptCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customer-receipts' });
  const { selectProps: customerSelectProps } = useSelect({
    resource: 'customers',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('customer_receipts', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'customer_id')} name="customer_id" rules={[{ required: true, message: t('validation.required_customer') }]}>
              <Select {...customerSelectProps} showSearch placeholder={t('placeholder.select_customer')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('customer_receipts', 'receipt_date')}
              name="receipt_date"
              rules={[{ required: true, message: t('validation.required_receipt_date') }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.amount')} name="amount" rules={[{ required: true, message: t('validation.required_amount') }]}>
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'payment_method')} name="payment_method">
              <Select
                options={translateOptions(PAYMENT_METHOD_OPTIONS, t)}
                placeholder={t('placeholder.select_payment_method')}
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
