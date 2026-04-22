import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CostCenterEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'cost-centers' });
  const { data: centersData } = useList({ resource: 'cost-centers', pagination: { pageSize: 500 } });
  const parentOptions = (centersData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));
  const { data: employeesData } = useList({ resource: 'employees', pagination: { pageSize: 500 } });
  const managerOptions = (employeesData?.data ?? []).map((e: any) => ({ label: e.name, value: e.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('cost_centers', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'code')} name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'name')} name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'parent_id')} name="parent_id">
              <Select options={parentOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'manager_id')} name="manager_id">
              <Select options={managerOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'is_active')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
