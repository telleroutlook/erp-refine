import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CarrierCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'carriers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('carriers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('carriers', 'code') }) }]}>
              <Input placeholder={t('placeholders.example', { example: 'SF-001' })} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('carriers', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'carrier_type')} name="carrier_type" initialValue="express">
              <Select>
                <Select.Option value="express">{t('enums.carrierType.express')}</Select.Option>
                <Select.Option value="freight">{t('enums.carrierType.freight')}</Select.Option>
                <Select.Option value="ltl">{t('enums.carrierType.ltl')}</Select.Option>
                <Select.Option value="ftl">{t('enums.carrierType.ftl')}</Select.Option>
                <Select.Option value="ocean">{t('enums.carrierType.ocean')}</Select.Option>
                <Select.Option value="air">{t('enums.carrierType.air')}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'contact')} name="contact">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'phone')} name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={fl('carriers', 'tracking_url_template')}
              name="tracking_url_template"
            >
              <Input placeholder="https://example.com/track/{tracking_number}" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
