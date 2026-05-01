import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { PAYMENT_METHOD_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerReceiptEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'customer-receipts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('customer_receipts', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'receipt_number')} name="receipt_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('customer_receipts', 'payment_method')} name="payment_method">
              <Select
                options={translateOptions(PAYMENT_METHOD_OPTIONS, t, 'enums.paymentMethod')}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
