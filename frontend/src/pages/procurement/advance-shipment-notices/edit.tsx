import React, { useMemo } from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { ASN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';

export const AdvanceShipmentNoticeEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'advance-shipment-notices' });
  const { t } = useTranslation();
  const record = queryResult?.data?.data as any;
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: warehouseProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: '行号', width: 60 },
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'quantity', title: '数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'lot_no', title: '批次号', width: 140, editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑ASN">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label="ASN编号" name="asn_no"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(ASN_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="供应商" name="supplier_id"><Select {...supplierProps} showSearch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="仓库" name="warehouse_id"><Select {...warehouseProps} showSearch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="预计到货日" name="expected_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="remark"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="asn-lines" parentResource="advance-shipment-notices" parentId={record?.id} parentFk="asn_id" items={record?.items ?? []} columns={itemColumns} title="ASN行项" productsMap={productsMap} />
    </Edit>
  );
};
