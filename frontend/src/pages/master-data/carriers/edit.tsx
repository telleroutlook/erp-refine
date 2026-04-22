import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { useTranslation } from 'react-i18next';

export const CarrierEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'carriers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('carriers', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'code')} name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'name')} name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('carriers', 'type')} name="carrier_type">
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
            <Form.Item label={fl('carriers', 'is_active')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={fl('carriers', 'tracking_url_template')}
              name="tracking_url_template"
              
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
