import React, { useEffect, useState } from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Divider } from 'antd';
import { PageSpinner } from '../../../components/shared/PageSpinner';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useCreateFrom } from '../../../hooks';
import { CreateFromItemsTable } from '../../../components/shared/CreateFromItemsTable';
import type { CreateFromData } from '../../../hooks/useCreateFrom';

export const PurchaseReceiptCreate: React.FC = () => {
  const { formProps, saveButtonProps, onFinish } = useForm({ resource: 'purchase-receipts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { selectProps: poSelectProps } = useSelect({
    resource: 'purchase-orders',
    optionLabel: 'order_number',
    optionValue: 'id',
  });
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: 'name',
    optionValue: 'id',
  });
  const { selectProps: warehouseSelectProps } = useSelect({
    resource: 'warehouses',
    optionLabel: 'name',
    optionValue: 'id',
  });

  const { isCreateFrom, sourceData, isLoading: sourceLoading, sourceRef } = useCreateFrom('purchase-receipts');
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
    <Create saveButtonProps={saveButtonProps} title={pt('purchase_receipts', 'create')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_receipts', 'purchase_order_id')} name="purchase_order_id">
              <Select {...poSelectProps} showSearch allowClear placeholder={t('placeholder.select_purchase_order')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_receipts', 'supplier_id')} name="supplier_id">
              <Select {...supplierSelectProps} showSearch allowClear placeholder={t('placeholder.select_supplier')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_receipts', 'warehouse_id')} name="warehouse_id" rules={[{ required: true, message: t('validation.required_warehouse') }]}>
              <Select {...warehouseSelectProps} showSearch placeholder={t('placeholder.select_warehouse')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('purchase_receipts', 'receipt_date')}
              name="receipt_date"
              rules={[{ required: true, message: t('validation.required_receipt_date') }]}
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
