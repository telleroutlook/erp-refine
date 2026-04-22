import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Switch, Row, Col } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PriceListCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'price-lists' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('price_lists', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('price_lists', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('price_lists', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('price_lists', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('price_lists', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('price_lists', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('price_lists', 'effective_date')}
              name="effective_from"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('price_lists', 'expiry_date')}
              name="effective_to"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('price_lists', 'is_default')} name="is_default" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
