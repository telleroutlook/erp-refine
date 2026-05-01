import React from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, InputNumber } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'sales-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: customerSelectProps } = useSelect({
    resource: 'customers',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('sales_orders', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_orders', 'customer_id')} name="customer_id" rules={[{ required: true, message: t('validation.required_customer') }]}>
              <Select {...customerSelectProps} showSearch placeholder={t('placeholder.select_customer')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_orders', 'order_date')}
              name="order_date"
              rules={[{ required: true, message: t('validation.required_order_date') }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_orders', 'delivery_date')}
              name="delivery_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_orders', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_orders', 'payment_terms')} name="payment_terms">
              <InputNumber style={FULL_WIDTH} min={0} />
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
