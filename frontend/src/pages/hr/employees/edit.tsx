import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { EMPLOYEE_STATUS_OPTIONS } from '../../../constants/options';

export const EmployeeEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'employees' });
  const { data: deptData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const deptOptions = (deptData?.data ?? []).map((d: any) => ({ label: `${d.code} - ${d.name}`, value: d.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑员工">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="工号" name="employee_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="姓名" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="部门" name="department_id">
              <Select options={deptOptions} showSearch optionFilterProp="label" allowClear placeholder="选择部门" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="职位" name="position">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="邮箱" name="email">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="电话" name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="入职日期"
              name="hire_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={EMPLOYEE_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
