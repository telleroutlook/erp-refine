import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { useTranslation } from 'react-i18next';

export const ExchangeRateEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'exchange-rates' });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('exchange_rates', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'from_currency')} name="from_currency">
              <Select disabled options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'to_currency')} name="to_currency">
              <Select disabled options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('exchange_rates', 'rate')} name="rate">
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
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('exchange_rates', 'expiry_date')}
              name="expiry_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
