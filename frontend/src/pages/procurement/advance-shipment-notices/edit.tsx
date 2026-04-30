import React, { useState } from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { ASN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

export const AdvanceShipmentNoticeEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'advance-shipment-notices' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: warehouseProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: fl('asn_lines', 'line_number'), width: 60 },
    { dataIndex: 'product_id', title: fl('asn_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'quantity', title: fl('asn_lines', 'quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'lot_no', title: fl('asn_lines', 'lot_no'), width: 140, editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('advance_shipment_notices', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('advance_shipment_notices', 'asn_no')} name="asn_no"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(ASN_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('advance_shipment_notices', 'supplier_id')} name="supplier_id"><Select {...supplierProps} showSearch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('advance_shipment_notices', 'warehouse_id')} name="warehouse_id"><Select {...warehouseProps} showSearch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('advance_shipment_notices', 'expected_date')} name="expected_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="remark"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.asnLines')} onChange={setItemsPayload} productsMap={productsMap} />
    </Edit>
  );
};
