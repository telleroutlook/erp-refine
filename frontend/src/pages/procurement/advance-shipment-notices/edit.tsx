import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { ASN_STATUS_OPTIONS } from '../../../constants/options';

export const AdvanceShipmentNoticeEdit: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'advance-shipment-notices' });
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: warehouseProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑ASN">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="ASN编号" name="asn_no">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={ASN_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id">
              <Select {...supplierProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select {...warehouseProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预计到货日" name="expected_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="remark">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
