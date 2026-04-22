import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { CONTRACT_TYPE_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

export const ContractCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'contracts' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建合同">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="合同类型" name="contract_type" rules={[{ required: true, message: '请选择合同类型' }]}>
              <Select options={CONTRACT_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="对方类型" name="party_type" rules={[{ required: true, message: '请选择对方类型' }]}>
              <Select
                options={[
                  { value: 'customer', label: '客户' },
                  { value: 'supplier', label: '供应商' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="对方ID" name="party_id">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="开始日期"
              name="start_date"
              rules={[{ required: true, message: '请选择开始日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="结束日期"
              name="end_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="税率" name="tax_rate">
              <InputNumber style={FULL_WIDTH} min={0} max={100} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="付款条件（天）" name="payment_terms">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
