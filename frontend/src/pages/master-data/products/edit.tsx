import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { PRODUCT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProductEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'products' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('products', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('products', 'code') }) }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('products', 'name') }) }]}><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'unit')} name="uom"><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status"><Select options={translateOptions(PRODUCT_STATUS_OPTIONS, t)} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'cost_price')} name="cost_price"><InputNumber style={FULL_WIDTH} min={0} precision={2} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('products', 'sale_price')} name="sale_price"><InputNumber style={FULL_WIDTH} min={0} precision={2} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('products', 'description')} name="description"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
