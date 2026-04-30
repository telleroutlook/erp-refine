import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SerialNumberCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'serial-numbers' });
  const { selectProps: productSelectProps } = useSelect({ resource: 'products', optionLabel: (r: any) => `${r.code} - ${r.name}` });
  const { selectProps: warehouseSelectProps } = useSelect({ resource: 'warehouses', optionLabel: (r: any) => `${r.code} - ${r.name}` });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('serial_numbers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'serial_number')} name="serial_number" rules={[{ required: true }]}>
              <Input placeholder="SN-20260401-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select {...productSelectProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'warehouse_id')} name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
