import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const InventoryLotCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-lots' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('inventory_lots', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('inventory_lots', 'lot_number')} name="lot_number" rules={[{ required: true }]}>
              <Input placeholder="LOT-20260401-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('inventory_lots', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('inventory_lots', 'warehouse_id')} name="warehouse_id" rules={[{ required: true }]}>
              <Select options={warehouseOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('inventory_lots', 'quantity')} name="quantity" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('inventory_lots', 'manufacture_date')}
              name="manufacture_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('inventory_lots', 'expiry_date')}
              name="expiry_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
