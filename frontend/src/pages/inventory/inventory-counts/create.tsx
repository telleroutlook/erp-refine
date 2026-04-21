import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';

export const InventoryCountCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-counts' });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建库存盘点">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="仓库" name="warehouse_id" rules={[{ required: true, message: '请选择仓库' }]}>
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="盘点日期"
              name="count_date"
              rules={[{ required: true, message: '请选择盘点日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
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
