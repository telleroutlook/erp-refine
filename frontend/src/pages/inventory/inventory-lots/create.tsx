import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';

export const InventoryLotCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-lots' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建批次">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="批次号" name="lot_number" rules={[{ required: true, message: '请输入批次号' }]}>
              <Input placeholder="如：LOT-20260401-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id" rules={[{ required: true, message: '请选择仓库' }]}>
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="数量" name="quantity" rules={[{ required: true, message: '请输入数量' }]}>
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生产日期"
              name="manufacture_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
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
