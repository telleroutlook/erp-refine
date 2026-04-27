import React from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { CURRENCY_OPTIONS, PAYMENT_METHOD_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PaymentRequestCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'payment-requests' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const paymentMethodOpts = translateOptions(PAYMENT_METHOD_OPTIONS, t, 'enums.paymentMethod');
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: 'name',
    optionValue: 'id',
  });
  const { selectProps: invoiceSelectProps } = useSelect({
    resource: 'supplier-invoices',
    optionLabel: 'invoice_number',
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('payment_requests', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'supplier_id')} name="supplier_id">
              <Select {...supplierSelectProps} showSearch allowClear placeholder={t('placeholder.select_supplier')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'supplier_invoice_id')} name="supplier_invoice_id">
              <Select {...invoiceSelectProps} showSearch allowClear placeholder={t('placeholder.select_supplier_invoice')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'amount')} name="amount" rules={[{ required: true, message: t('validation.required_amount') }]}>
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('payment_requests', 'due_date')}
              name="due_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'payment_method')} name="payment_method">
              <Select options={paymentMethodOpts} allowClear />
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
