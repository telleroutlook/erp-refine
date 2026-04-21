import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const CostCenterEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'cost-centers' });
  const { data: centersData } = useList({ resource: 'cost-centers', pagination: { pageSize: 500 } });
  const parentOptions = (centersData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));
  const { data: employeesData } = useList({ resource: 'employees', pagination: { pageSize: 500 } });
  const managerOptions = (employeesData?.data ?? []).map((e: any) => ({ label: e.name, value: e.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑成本中心">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编码" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="上级中心" name="parent_id">
              <Select options={parentOptions} showSearch optionFilterProp="label" placeholder="选择上级中心" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="负责人" name="manager_id">
              <Select options={managerOptions} showSearch optionFilterProp="label" placeholder="选择负责人" allowClear />
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
