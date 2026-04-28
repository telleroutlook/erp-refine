import React, { useMemo, useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { QUOTATION_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierQuotationEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'supplier-quotations' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('supplier_quotation_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'qty_offered', title: fl('supplier_quotation_lines', 'qty_offered'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('supplier_quotation_lines', 'unit_price'), width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'total_price', title: fl('supplier_quotation_lines', 'total_price'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['qty_offered']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'lead_time_days', title: fl('supplier_quotation_lines', 'lead_time_days'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'description', title: fl('supplier_quotation_lines', 'description'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('supplier_quotations', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_quotations', 'quotation_number')} name="quotation_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(QUOTATION_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_quotations', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('supplier_quotations', 'validity_date')} name="validity_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.lines ?? []} columns={lineColumns} title={t('sections.quotationLines')} onChange={setItemsPayload} productsMap={productsMap} priceField="cost_price" />
    </Edit>
  );
};
