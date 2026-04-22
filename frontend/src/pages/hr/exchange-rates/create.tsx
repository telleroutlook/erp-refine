import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ExchangeRateCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'exchange-rates' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('exchange_rates', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'from_currency')} name="from_currency" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('exchange_rates', 'from_currency') }) }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'to_currency')} name="to_currency" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('exchange_rates', 'to_currency') }) }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'rate')} name="rate" rules={[{ required: true, message: t('validation.required', { field: fl('exchange_rates', 'rate') }) }]}>
              <InputNumber style={FULL_WIDTH} min={0} step={0.0001} precision={4} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'type')} name="rate_type">
              <Select
                options={[
                  { value: 'spot', label: t('enums.rateType.spot') },
                  { value: 'average', label: t('enums.rateType.average') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('exchange_rates', 'effective_date')}
              name="effective_date"
              rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('exchange_rates', 'effective_date') }) }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('exchange_rates', 'expiry_date')}
              name="expiry_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
