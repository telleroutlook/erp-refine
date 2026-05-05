import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, InputNumber, Select, Switch, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';
import { useSelect } from '@refinedev/antd';

export const ProductUomConversionEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'product-uom-conversions' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: productSelectProps } = useProductSearch();

  const { selectProps: uomSelectProps } = useSelect({
    resource: 'uoms',
    optionLabel: (r: any) => `${r.uom_code} - ${r.uom_name}`,
    optionValue: (r: any) => r.id,
    pagination: { pageSize: 100 },
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('product_uom_conversions', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_uom_conversions', 'product_id')} name="product_id">
              <Select {...productSelectProps} allowClear placeholder={t('common.general')} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_uom_conversions', 'from_uom_id')} name="from_uom_id" rules={[{ required: true }]}>
              <Select {...uomSelectProps} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_uom_conversions', 'to_uom_id')} name="to_uom_id" rules={[{ required: true }]}>
              <Select {...uomSelectProps} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_uom_conversions', 'conversion_factor')} name="conversion_factor" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0.000001} step={0.01} precision={6} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('product_uom_conversions', 'is_active')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
