import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';

export const WarehouseCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建仓库">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库编号" name="code" rules={[{ required: true, message: '请输入仓库编号' }]}>
              <Input placeholder="如：WH-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库名称" name="name" rules={[{ required: true, message: '请输入仓库名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库类型" name="type" initialValue="standard">
              <Select options={[
                { label: '标准', value: 'standard' },
                { label: '冷库', value: 'cold_storage' },
                { label: '危险品', value: 'hazardous' },
                { label: '保税', value: 'bonded' },
                { label: '虚拟', value: 'virtual' },
              ]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="active">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
