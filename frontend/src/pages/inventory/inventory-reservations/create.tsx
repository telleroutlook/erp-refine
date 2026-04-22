import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';

export const InventoryReservationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-reservations' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建库存预留">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
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
            <Form.Item label="预留数量" name="reserved_quantity" rules={[{ required: true, message: '请输入预留数量' }]}>
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="引用类型" name="reference_type" rules={[{ required: true, message: '请输入引用类型' }]}>
              <Input placeholder="如：sales_order, work_order" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="引用ID" name="reference_id" rules={[{ required: true, message: '请输入引用ID' }]}>
              <Input placeholder="关联单据ID" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期时间"
              name="expires_at"
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
