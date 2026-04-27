import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Row, Col, Switch } from 'antd';
import { PRODUCT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProductCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('products', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('products', 'code') }) }]}>
              <Input placeholder={t('placeholders.example', { example: 'PROD-001' })} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('products', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'unit')} name="uom">
              <Input  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="active">
              <Select options={translateOptions(PRODUCT_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'requires_inspection')} name="requires_inspection" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('products', 'description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
