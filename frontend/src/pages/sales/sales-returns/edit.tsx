import React, { useMemo, useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RETURN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesReturnEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'sales-returns' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);
  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('sales_return_items', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
    { dataIndex: 'quantity', title: fl('sales_return_items', 'quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('sales_return_items', 'unit_price'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
    { dataIndex: 'amount', title: fl('sales_return_items', 'line_total'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('sales_returns', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('sales_returns', 'return_number')} name="return_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(RETURN_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('sales_returns', 'return_date')} name="return_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.returnLines')} productsMap={productsMap} priceField="sale_price" onChange={setItemsPayload} />
    </Edit>
  );
};
