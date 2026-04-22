import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';

export const EmployeeCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'employees' });
  const { data: deptData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const deptOptions = (deptData?.data ?? []).map((d: any) => ({ label: `${d.code} - ${d.name}`, value: d.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建员工">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="工号" name="employee_number" rules={[{ required: true, message: '请输入工号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="部门" name="department_id">
              <Select options={deptOptions} showSearch optionFilterProp="label" allowClear placeholder="选择部门" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="职位" name="position">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="邮箱" name="email">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="电话" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="入职日期"
              name="hire_date"
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
