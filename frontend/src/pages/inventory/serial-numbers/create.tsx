import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';

export const SerialNumberCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'serial-numbers' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建序列号">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="序列号" name="serial_number" rules={[{ required: true, message: '请输入序列号' }]}>
              <Input placeholder="如：SN-20260401-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
