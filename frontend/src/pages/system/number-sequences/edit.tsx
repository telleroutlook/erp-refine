import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, InputNumber, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { FULL_WIDTH } from '../../../constants/styles';

export const NumberSequenceEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'number-sequences' });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('number_sequences', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('number_sequences', 'sequence_name')} name="sequence_name">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('number_sequences', 'prefix')} name="prefix">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('number_sequences', 'current_value')} name="current_value">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('number_sequences', 'padding')} name="padding">
              <InputNumber style={FULL_WIDTH} min={1} max={10} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('number_sequences', 'increment_by')} name="increment_by">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
