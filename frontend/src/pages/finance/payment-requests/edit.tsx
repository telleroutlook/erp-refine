import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { PAYMENT_REQUEST_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PaymentRequestEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'payment-requests' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('payment_requests', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'request_number')} name="request_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={translateOptions(PAYMENT_REQUEST_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'currency')} name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('payment_requests', 'ok_to_pay')} name="ok_to_pay" valuePropName="checked">
              <Switch checkedChildren={t('enums.yesNo.yes')} unCheckedChildren={t('enums.yesNo.no')} />
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
