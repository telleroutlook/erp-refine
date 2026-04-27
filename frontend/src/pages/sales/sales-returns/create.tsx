import React from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesReturnCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'sales-returns' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: customerSelectProps } = useSelect({
    resource: 'customers',
    optionLabel: 'name',
    optionValue: 'id',
  });
  const { selectProps: soSelectProps } = useSelect({
    resource: 'sales-orders',
    optionLabel: 'order_number',
    optionValue: 'id',
  });
  const { selectProps: warehouseSelectProps } = useSelect({
    resource: 'warehouses',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('sales_returns', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_returns', 'customer_id')} name="customer_id" rules={[{ required: true, message: t('validation.required_customer') }]}>
              <Select {...customerSelectProps} showSearch placeholder={t('placeholder.select_customer')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_returns', 'sales_order_id')} name="sales_order_id">
              <Select {...soSelectProps} showSearch allowClear placeholder={t('placeholder.select_sales_order')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_returns', 'return_date')}
              name="return_date"
              rules={[{ required: true, message: t('validation.required_return_date') }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_returns', 'warehouse_id')} name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch allowClear placeholder={t('placeholder.select_warehouse')} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('sales_returns', 'reason')} name="reason">
              <Input.TextArea rows={3} />
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
