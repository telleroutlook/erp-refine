import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const AccountSubjectCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'account-subjects' });
  const { selectProps: parentSelectProps } = useSelect({
    resource: 'account-subjects',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('account_subjects', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('account_subjects', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('account_subjects', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'category')} name="category">
              <Select
                options={[
                  { value: 'asset', label: t('enums.accountCategory.asset') },
                  { value: 'liability', label: t('enums.accountCategory.liability') },
                  { value: 'equity', label: t('enums.accountCategory.equity') },
                  { value: 'revenue', label: t('enums.accountCategory.revenue') },
                  { value: 'expense', label: t('enums.accountCategory.expense') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'balance_direction')} name="balance_direction">
              <Select
                options={[
                  { value: 'debit', label: t('enums.balanceDirection.debit') },
                  { value: 'credit', label: t('enums.balanceDirection.credit') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'parent_id')} name="parent_id">
              <Select {...parentSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'is_leaf')} name="is_leaf" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
