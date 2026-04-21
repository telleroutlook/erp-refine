import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const StorageLocationEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'storage-locations' });
  const { data: warehouseData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehouseData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑库位">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="区域" name="zone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
