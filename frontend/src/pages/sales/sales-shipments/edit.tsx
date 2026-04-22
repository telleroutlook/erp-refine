import React, { useMemo } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { SHIPMENT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesShipmentEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'sales-shipments' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('sales_shipment_items', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
    { dataIndex: 'quantity', title: fl('sales_shipment_items', 'quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('sales_shipments', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('sales_shipments', 'shipment_number')} name="shipment_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(SHIPMENT_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('sales_shipments', 'shipment_date')} name="shipment_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="sales-shipment-items" parentResource="sales-shipments" parentId={record?.id} parentFk="sales_shipment_id" items={record?.items ?? []} columns={itemColumns} title={t('sections.shipmentLines')} productsMap={productsMap} />
    </Edit>
  );
};
