import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityStandardCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'quality-standards' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('quality_standards', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'standard_code')} name="standard_code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'standard_name')} name="standard_name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('quality_standards', 'description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
