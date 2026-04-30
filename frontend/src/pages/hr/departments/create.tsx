import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DepartmentCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'departments' });
  const { selectProps: deptSelectProps } = useSelect({
    resource: 'departments',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });

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
              <Select {...deptSelectProps} showSearch allowClear  />
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
