import React, { useEffect, useState } from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Divider } from 'antd';
import { PageSpinner } from '../../../components/shared/PageSpinner';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useCreateFrom } from '../../../hooks';
import { CreateFromItemsTable } from '../../../components/shared/CreateFromItemsTable';
import type { CreateFromData } from '../../../hooks/useCreateFrom';

export const SalesShipmentCreate: React.FC = () => {
  const { formProps, saveButtonProps, onFinish } = useForm({ resource: 'sales-shipments' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: soSelectProps } = useSelect({
    resource: 'sales-orders',
    optionLabel: 'order_number',
    optionValue: 'id',
  });
  const { selectProps: customerSelectProps } = useSelect({
    resource: 'customers',
    optionLabel: 'name',
    optionValue: 'id',
  });
  const { selectProps: warehouseSelectProps } = useSelect({
    resource: 'warehouses',
    optionLabel: 'name',
    optionValue: 'id',
  });

  const { isCreateFrom, sourceData, isLoading: sourceLoading, sourceRef } = useCreateFrom('sales-shipments');
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
    <Create saveButtonProps={saveButtonProps} title={pt('sales_shipments', 'create')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'sales_order_id')} name="sales_order_id" rules={[{ required: true, message: t('validation.required_sales_order') }]}>
              <Select {...soSelectProps} showSearch placeholder={t('placeholder.select_sales_order')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'customer_id')} name="customer_id" rules={[{ required: true, message: t('validation.required_customer') }]}>
              <Select {...customerSelectProps} showSearch placeholder={t('placeholder.select_customer')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('sales_shipments', 'shipment_date')}
              name="shipment_date"
              rules={[{ required: true, message: t('validation.required_shipment_date') }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'warehouse_id')} name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch allowClear placeholder={t('placeholder.select_warehouse')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'carrier')} name="carrier">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'shipping_method')} name="shipping_method">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('sales_shipments', 'tracking_number')} name="tracking_number">
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
