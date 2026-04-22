import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProductCategoryCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'product-categories' });
  const { data: catData } = useList({ resource: 'product-categories', pagination: { pageSize: 500 } });
  const catOptions = (catData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('product_categories', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('product_categories', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('product_categories', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'parent_id')} name="parent_id">
              <Select options={catOptions} showSearch optionFilterProp="label" allowClear  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
