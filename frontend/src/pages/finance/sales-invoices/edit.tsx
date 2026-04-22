import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS } from '../../../constants/options';

export const SalesInvoiceEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'sales-invoices' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售发票">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="发票号" name="invoice_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日"
              name="due_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} disabled />
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
