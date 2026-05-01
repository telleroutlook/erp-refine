import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH } from '../../../constants/styles';
import { ASN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const AdvanceShipmentNoticeCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'advance-shipment-notices' });
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: warehouseProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: poProps } = useSelect({ resource: 'purchase-orders', optionLabel: 'order_number', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('advance_shipment_notices', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('advance_shipment_notices', 'supplier_id')} name="supplier_id" rules={[{ required: true, message: t('validation.required_supplier') }]}>
              <Select {...supplierProps} showSearch placeholder={t('placeholder.select_supplier')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('advance_shipment_notices', 'warehouse_id')} name="warehouse_id" rules={[{ required: true, message: t('validation.required_warehouse') }]}>
              <Select {...warehouseProps} showSearch placeholder={t('placeholder.select_warehouse')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('advance_shipment_notices', 'po_id')} name="po_id">
              <Select {...poProps} showSearch allowClear placeholder={t('placeholder.select_purchase_order')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('advance_shipment_notices', 'expected_date')} name="expected_date" rules={[{ required: true, message: t('validation.required_expected_date') }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="open">
              <Select options={translateOptions(ASN_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="remark">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
