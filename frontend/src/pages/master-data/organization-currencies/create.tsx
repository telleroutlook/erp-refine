import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const OrganizationCurrencyCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'organization-currencies' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  const { selectProps: currencySelectProps } = useSelect({
    resource: 'currencies',
    optionLabel: 'currency_code',
    optionValue: 'currency_code',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('organization-currencies', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organization_currencies', 'currency_code')} name="currency_code" rules={[{ required: true, message: t('validation.required', { field: fl('organization_currencies', 'currency_code') }) }]}>
              <Select {...currencySelectProps} placeholder={t('placeholders.select')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organization_currencies', 'is_default')} name="is_default" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
