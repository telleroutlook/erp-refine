import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

export const ExchangeRateCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'exchange-rates' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建汇率">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="源币种" name="from_currency" rules={[{ required: true, message: '请选择源币种' }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="目标币种" name="to_currency" rules={[{ required: true, message: '请选择目标币种' }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="汇率" name="rate" rules={[{ required: true, message: '请输入汇率' }]}>
              <InputNumber style={FULL_WIDTH} min={0} step={0.0001} precision={4} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="类型" name="rate_type">
              <Select
                options={[
                  { value: 'spot', label: '即期' },
                  { value: 'average', label: '平均' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生效日期"
              name="effective_date"
              rules={[{ required: true, message: '请选择生效日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="expiry_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
