import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { QUOTATION_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierQuotationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'supplier-quotations' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const statusOpts = translateOptions(QUOTATION_STATUS_OPTIONS.slice(0, 2), t);

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('supplier_quotations', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('supplier_quotations', 'supplier_id')} name="supplier_id" rules={[{ required: true, message: t('validation.required_supplier') }]}>
              <Select {...supplierSelectProps} showSearch placeholder={t('placeholder.select_supplier')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={statusOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('supplier_quotations', 'rfq_id')} name="rfq_id">
              <Input placeholder={t('placeholder.link_rfq_optional')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('supplier_quotations', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('supplier_quotations', 'validity_date')}
              name="validity_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
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
