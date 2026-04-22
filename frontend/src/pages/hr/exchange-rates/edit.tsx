import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';

export const ExchangeRateEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'exchange-rates' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑汇率">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="源币种" name="from_currency">
              <Select disabled options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="目标币种" name="to_currency">
              <Select disabled options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="汇率" name="rate">
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
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="expiry_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
