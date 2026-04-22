import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DepartmentCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'departments' });
  const { data: deptData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const deptOptions = (deptData?.data ?? []).map((d: any) => ({ label: `${d.code} - ${d.name}`, value: d.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('departments', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('departments', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('departments', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'parent_id')} name="parent_id">
              <Select options={deptOptions} showSearch optionFilterProp="label" allowClear  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'manager_id')} name="manager_id">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
