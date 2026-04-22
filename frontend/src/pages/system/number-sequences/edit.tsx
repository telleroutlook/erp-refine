import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, InputNumber, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH } from '../../../constants/styles';

export const NumberSequenceEdit: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'number-sequences' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑编号规则">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="序列名称" name="sequence_name">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="前缀" name="prefix">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="当前值" name="current_value">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="补零位数" name="padding">
              <InputNumber style={FULL_WIDTH} min={1} max={10} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="步长" name="increment_by">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
