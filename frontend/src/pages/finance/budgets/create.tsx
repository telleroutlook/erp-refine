import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';

export const BudgetCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'budgets' });
  const { t } = useTranslation();

  return (
    <Create saveButtonProps={saveButtonProps} title="新建预算">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预算名称" name="budget_name" rules={[{ required: true, message: '请输入预算名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预算类型" name="budget_type">
              <Select
                options={[
                  { value: 'annual', label: '年度' },
                  { value: 'quarterly', label: '季度' },
                  { value: 'monthly', label: '月度' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="年度" name="budget_year">
              <InputNumber style={FULL_WIDTH} min={2020} max={2030} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
