import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH } from '../../../constants/styles';
import { ASN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const AdvanceShipmentNoticeCreate: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'advance-shipment-notices' });
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: warehouseProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: poProps } = useSelect({ resource: 'purchase-orders', optionLabel: 'order_number', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建ASN">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select {...supplierProps} showSearch placeholder="选择供应商" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id" rules={[{ required: true, message: '请选择仓库' }]}>
              <Select {...warehouseProps} showSearch placeholder="选择仓库" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="采购订单" name="po_id">
              <Select {...poProps} showSearch allowClear placeholder="选择采购订单" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预计到货日" name="expected_date" rules={[{ required: true, message: '请选择预计到货日' }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
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
