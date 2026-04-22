import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { DEPARTMENT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DepartmentEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'departments' });
  const { data: deptData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const deptOptions = (deptData?.data ?? []).map((d: any) => ({ label: `${d.code} - ${d.name}`, value: d.id }));
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
              <Select options={deptOptions} showSearch optionFilterProp="label" allowClear  />
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
