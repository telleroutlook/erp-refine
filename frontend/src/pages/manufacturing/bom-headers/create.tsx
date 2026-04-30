import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Switch } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const BomHeaderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'bom-headers' });
  const { selectProps: productSelectProps } = useSelect({ resource: 'products', optionLabel: (r: any) => `${r.code} - ${r.name}` });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('bom_headers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('bom_headers', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select {...productSelectProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('bom_headers', 'quantity')} name="quantity" initialValue={1} rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0.01} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('bom_headers', 'version')} name="version" initialValue="1.0">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('bom_headers', 'effective_date')} name="effective_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('bom_headers', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
