import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { CONTRACT_TYPE_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ContractCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'contracts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('contracts', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'contract_type')} name="contract_type" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('contracts', 'contract_type') }) }]}>
              <Select options={translateOptions(CONTRACT_TYPE_OPTIONS, t, 'enums.contractType')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'party_type')} name="party_type" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('contracts', 'party_type') }) }]}>
              <Select
                options={[
                  { value: 'customer', label: t('enums.partyType.customer') },
                  { value: 'supplier', label: t('enums.partyType.supplier') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'party_id')} name="party_id">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('contracts', 'start_date')}
              name="start_date"
              rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('contracts', 'start_date') }) }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('contracts', 'end_date')}
              name="end_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'tax_rate')} name="tax_rate">
              <InputNumber style={FULL_WIDTH} min={0} max={100} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('contracts', 'payment_terms')} name="payment_terms">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('contracts', 'description')} name="description">
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
