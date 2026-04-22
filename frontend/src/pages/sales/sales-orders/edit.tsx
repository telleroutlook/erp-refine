import React, { useMemo } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { SO_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';

export const SalesOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'sales-orders' });
  const { t } = useTranslation();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => {
    const m = new Map<string, ProductInfo>();
    (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p));
    return m;
  }, [productsData]);

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: '行号', width: 60 },
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
    { dataIndex: 'quantity', title: '数量', width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'amount', title: '行合计', width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售订单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label="订单号" name="order_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(SO_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="订单日期" name="order_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label="货币" name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="sales-order-items" parentResource="sales-orders" parentId={record?.id} parentFk="sales_order_id" items={record?.items ?? []} columns={itemColumns} title="订单行" productsMap={productsMap} priceField="sale_price" />
    </Edit>
  );
};
