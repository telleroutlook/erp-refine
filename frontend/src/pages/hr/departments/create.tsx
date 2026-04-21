import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';

export const DepartmentCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'departments' });
  const { data: deptData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const deptOptions = (deptData?.data ?? []).map((d: any) => ({ label: `${d.code} - ${d.name}`, value: d.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建部门">
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
            <Form.Item label="上级部门" name="parent_id">
              <Select options={deptOptions} showSearch optionFilterProp="label" allowClear placeholder="选择上级部门" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="负责人" name="manager_id">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
