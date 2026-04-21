import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Switch } from 'antd';

export const BomHeaderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'bom-headers' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建物料清单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="基准数量" name="quantity" initialValue={1} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0.01} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="版本" name="version" initialValue="1.0">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="生效日期" name="effective_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
