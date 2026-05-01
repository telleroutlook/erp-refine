import React, { useEffect, useState } from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Divider } from 'antd';
import { PageSpinner } from '../../../components/shared/PageSpinner';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useCreateFrom } from '../../../hooks';
import { CreateFromItemsTable } from '../../../components/shared/CreateFromItemsTable';
import type { CreateFromData } from '../../../hooks/useCreateFrom';

export const SalesInvoiceCreate: React.FC = () => {
  const { formProps, saveButtonProps, onFinish } = useForm({ resource: 'sales-invoices' });
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

  const { isCreateFrom, sourceData, isLoading: sourceLoading, sourceRef } = useCreateFrom('sales-invoices');
  const [createFromItems, setCreateFromItems] = useState<CreateFromData['items']>([]);

  useEffect(() => {
    if (sourceData && formProps.form) {
      formProps.form.setFieldsValue(sourceData.header);
      setCreateFromItems(sourceData.items);
    }
  }, [sourceData, formProps.form]);

  const handleFinish = async (values: any) => {
    const payload: Record<string, unknown> = { ...values };
    if (isCreateFrom && createFromItems.length > 0) {
      payload.items = createFromItems.map((item) => {
        const { _open_quantity, _source_item_id, _product, ...rest } = item;
        return rest;
      });
      payload._sourceRef = sourceRef;
    }
    return onFinish(payload);
  };

  if (sourceLoading) return <PageSpinner />;

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('sales_invoices', 'create')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_invoices', 'customer_id')} name="customer_id" rules={[{ required: true, message: t('validation.required_customer') }]}>
              <Select {...customerSelectProps} showSearch placeholder={t('placeholder.select_customer')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_invoices', 'sales_order_id')} name="sales_order_id">
              <Select {...soSelectProps} showSearch allowClear placeholder={t('placeholder.select_sales_order')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_invoices', 'invoice_date')}
              name="invoice_date"
              rules={[{ required: true, message: t('validation.required_invoice_date') }]}
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_invoices', 'due_date')}
              name="due_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_invoices', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_invoices', 'payment_terms')} name="payment_terms">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {isCreateFrom && sourceData && createFromItems.length > 0 && (
          <>
            <Divider>{t('sections.lineItems', 'Line Items')}</Divider>
            <CreateFromItemsTable
              items={createFromItems}
              source={sourceData.source}
              onChange={setCreateFromItems}
            />
          </>
        )}
      </Form>
    </Create>
  );
};
