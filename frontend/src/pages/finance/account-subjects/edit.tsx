import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const AccountSubjectEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'account-subjects' });
  const { data: accountsData } = useList({ resource: 'account-subjects', pagination: { pageSize: 500 } });
  const parentOptions = (accountsData?.data ?? []).map((a: any) => ({ label: `${a.code} - ${a.name}`, value: a.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('account_subjects', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'code')} name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'name')} name="name">
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
              <Select options={parentOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('account_subjects', 'is_leaf')} name="is_leaf" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select
                options={[
                  { value: 'active', label: t('status.active') },
                  { value: 'inactive', label: t('status.inactive') },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
