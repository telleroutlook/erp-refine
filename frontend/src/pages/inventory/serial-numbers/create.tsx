import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SerialNumberCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'serial-numbers' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));
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
              <Select options={productOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'warehouse_id')} name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
