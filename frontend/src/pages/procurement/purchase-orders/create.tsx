import React, { useEffect, useState } from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Divider } from 'antd';
import { PageSpinner } from '../../../components/shared/PageSpinner';
import { PO_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useCreateFrom } from '../../../hooks';
import { CreateFromItemsTable } from '../../../components/shared/CreateFromItemsTable';
import type { CreateFromData } from '../../../hooks/useCreateFrom';

export const PurchaseOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps, onFinish } = useForm({ resource: 'purchase-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const statusOpts = translateOptions(PO_STATUS_OPTIONS.slice(0, 3), t);
  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: 'name',
    optionValue: 'id',
  });

  const { isCreateFrom, sourceData, isLoading: sourceLoading, sourceRef } = useCreateFrom('purchase-orders');
  const [createFromItems, setCreateFromItems] = useState<CreateFromData['items']>([]);

  useEffect(() => {
    if (sourceData && formProps.form) {
      const raw = sourceData as any;
      if (raw.status === 'ready' && raw.purchase_orders) {
        const po = raw.purchase_orders[0];
        if (po) {
          formProps.form.setFieldsValue({
            supplier_id: po.supplier_id,
            currency: po.currency ?? 'CNY',
          });
          setCreateFromItems(
            (po.items ?? []).map((item: any) => ({
              ...item,
              _open_quantity: item.quantity,
              _source_item_id: item.requisition_line_id,
              _product: item.product ?? null,
            }))
          );
        }
      } else if (raw.status === 'needs_supplier_selection' && raw.lines) {
        const lines = raw.lines as any[];
        const firstAssigned = lines.find((l: any) => l.assigned_supplier_id);
        if (firstAssigned) {
          formProps.form.setFieldsValue({ supplier_id: firstAssigned.assigned_supplier_id });
        }
        setCreateFromItems(
          lines.map((line: any) => ({
            product_id: line.product_id,
            quantity: line.quantity,
            unit_price: line.assigned_contract?.unit_price ?? line.product?.cost_price ?? 0,
            tax_rate: 0,
            requisition_line_id: line.requisition_line_id,
            _open_quantity: line.quantity,
            _source_item_id: line.requisition_line_id,
            _product: line.product ?? null,
          }))
        );
      } else if (raw.header) {
        formProps.form.setFieldsValue(raw.header);
        setCreateFromItems(raw.items ?? []);
      }
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
      if (sourceRef?.id) {
        payload.source_requisition_id = sourceRef.id;
      }
    }
    return onFinish(payload);
  };

  if (sourceLoading) return <PageSpinner />;

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('purchase_orders', 'create')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_orders', 'supplier_id')} name="supplier_id" rules={[{ required: true, message: t('validation.required_supplier') }]}>
              <Select {...supplierSelectProps} showSearch placeholder={t('placeholder.select_supplier')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={statusOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('purchase_orders', 'order_date')}
              name="order_date"
              rules={[{ required: true, message: t('validation.required_order_date') }]}
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('purchase_orders', 'expected_date')}
              name="expected_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_orders', 'currency')} name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_orders', 'payment_terms')} name="payment_terms">
              <InputNumber style={FULL_WIDTH} min={0} />
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
              source={(sourceData as any).source}
              onChange={setCreateFromItems}
            />
          </>
        )}
      </Form>
    </Create>
  );
};
