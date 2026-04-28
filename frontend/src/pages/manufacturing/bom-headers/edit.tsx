import React, { useMemo, useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Switch } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { EditableItemTable, type ColumnConfig, type ProductInfo, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const BomHeaderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'bom-headers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'sequence', title: fl('bom_items', 'sequence'), width: 60, editable: true, inputType: 'number' },
    { dataIndex: 'product_id', title: fl('bom_items', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
    { dataIndex: 'quantity', title: fl('bom_items', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit', title: fl('bom_items', 'unit'), width: 80, editable: true },
    { dataIndex: 'scrap_rate', title: fl('bom_items', 'scrap_rate'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => v ? `${v}%` : '-' },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('bom_headers', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'bom_number')} name="bom_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'product_id')} name="product_id" rules={[{ required: true }]}><Select options={productOptions} showSearch optionFilterProp="label" /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'quantity')} name="quantity" rules={[{ required: true }]}><InputNumber style={FULL_WIDTH} min={0.01} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'version')} name="version"><Input /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'effective_date')} name="effective_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('bom_headers', 'is_active')} name="is_active" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.bomItems')} productsMap={productsMap} onChange={setItemsPayload} />
    </Edit>
  );
};
