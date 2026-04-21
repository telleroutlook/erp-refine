import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { BUDGET_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const BudgetEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'budgets' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑预算">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="预算名称" name="budget_name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          <Col span={12}>
            <Form.Item label="年度" name="budget_year">
              <InputNumber style={{ width: '100%' }} min={2020} max={2030} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={BUDGET_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
