import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { DEFECT_SEVERITY_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DefectCodeCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'defect-codes' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('defect_codes', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('defect_codes', 'code')} name="code" rules={[{ required: true, message: t('validation.required_code') }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('defect_codes', 'name')} name="name" rules={[{ required: true, message: t('validation.required_name') }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('defect_codes', 'category')} name="category">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('defect_codes', 'severity')} name="severity">
              <Select options={translateOptions(DEFECT_SEVERITY_OPTIONS, t, 'enums.defectSeverity')} placeholder={t('placeholder.select_severity')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('defect_codes', 'description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('defect_codes', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
