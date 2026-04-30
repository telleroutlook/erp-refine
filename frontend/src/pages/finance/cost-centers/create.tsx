import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CostCenterCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'cost-centers' });
  const { selectProps: parentSelectProps } = useSelect({
    resource: 'cost-centers',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { selectProps: managerSelectProps } = useSelect({
    resource: 'employees',
    optionLabel: (r: any) => r.name,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('cost_centers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('cost_centers', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('cost_centers', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'parent_id')} name="parent_id">
              <Select {...parentSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'manager_id')} name="manager_id">
              <Select {...managerSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('cost_centers', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
