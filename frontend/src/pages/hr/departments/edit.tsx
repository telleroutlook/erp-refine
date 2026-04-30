import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { DEPARTMENT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DepartmentEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'departments' });
  const { selectProps: deptSelectProps } = useSelect({
    resource: 'departments',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('departments', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'code')} name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('departments', 'name')} name="name">
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
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={translateOptions(DEPARTMENT_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
