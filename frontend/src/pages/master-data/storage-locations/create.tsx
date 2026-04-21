import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const StorageLocationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'storage-locations' });
  const { data: warehouseData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehouseData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建库位">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库" name="warehouse_id" rules={[{ required: true, message: '请选择仓库' }]}>
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="区域" name="zone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
