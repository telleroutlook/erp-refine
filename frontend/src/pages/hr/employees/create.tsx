import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const EmployeeCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'employees' });
  const { selectProps: deptSelectProps } = useSelect({
    resource: 'departments',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('employees', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'employee_number')} name="employee_number" rules={[{ required: true, message: t('validation.required', { field: fl('employees', 'employee_number') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('employees', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'department')} name="department_id">
              <Select {...deptSelectProps} showSearch allowClear  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'position')} name="position">
              <Select
                options={[
                  { value: 'admin', label: t('enums.position.admin') },
                  { value: 'manager', label: t('enums.position.manager') },
                  { value: 'sales', label: t('enums.position.sales') },
                  { value: 'purchasing', label: t('enums.position.purchasing') },
                  { value: 'inventory', label: t('enums.position.inventory') },
                  { value: 'finance', label: t('enums.position.finance') },
                  { value: 'production', label: t('enums.position.production') },
                  { value: 'user', label: t('enums.position.user') },
                ]}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'email')} name="email">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('employees', 'phone')} name="phone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('employees', 'hire_date')}
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
