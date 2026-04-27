import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const OrganizationUomCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'organization-uoms' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  const { selectProps: uomSelectProps } = useSelect({
    resource: 'uoms',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('organization-uoms', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organization_uoms', 'uom_id')} name="uom_id" rules={[{ required: true, message: t('validation.required', { field: fl('organization_uoms', 'uom_id') }) }]}>
              <Select {...uomSelectProps} placeholder={t('placeholders.select')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('organization_uoms', 'is_default')} name="is_default" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
