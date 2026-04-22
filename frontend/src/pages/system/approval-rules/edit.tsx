import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ApprovalRuleEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'approval-rules' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('approval_rules', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('approval_rules', 'rule_name')} name="rule_name" rules={[{ required: true, message: t('validation.required', { field: fl('approval_rules', 'rule_name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('approval_rules', 'document_type')} name="document_type" rules={[{ required: true, message: t('validation.required', { field: fl('approval_rules', 'document_type') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('approval_rules', 'min_amount')} name="min_amount">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('approval_rules', 'max_amount')} name="max_amount">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('approval_rules', 'required_roles')} name="required_roles">
              <Select mode="tags"  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('approval_rules', 'sequence_order')} name="sequence_order" rules={[{ required: true, message: t('validation.required', { field: fl('approval_rules', 'sequence_order') }) }]}>
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="is_active">
              <Select
                options={[
                  { label: t('status.active'), value: true },
                  { label: t('status.inactive'), value: false },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
