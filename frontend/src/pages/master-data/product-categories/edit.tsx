import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { useTranslation } from 'react-i18next';

export const ProductCategoryEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'product-categories' });
  const { selectProps: catSelectProps } = useSelect({ resource: 'product-categories', optionLabel: (r: any) => `${r.code} - ${r.name}` });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('product_categories', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'code')} name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'name')} name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'parent_id')} name="parent_id">
              <Select {...catSelectProps} showSearch allowClear  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_categories', 'is_active')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
