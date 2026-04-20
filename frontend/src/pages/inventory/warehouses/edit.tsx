import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const WarehouseEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑仓库">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="仓库编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="类型" name="type">
              <Select options={[
                { label: '原材料仓', value: 'raw_material' },
                { label: '成品仓', value: 'finished_goods' },
                { label: '半成品仓', value: 'wip' },
                { label: '退货仓', value: 'returns' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
