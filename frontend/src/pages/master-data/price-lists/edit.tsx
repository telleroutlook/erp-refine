import React, { useMemo } from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Switch, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS, PRICE_LIST_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PriceListEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'price-lists' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('price_lists', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'unit_price', title: fl('price_lists', 'unit_price'), width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'min_quantity', title: fl('price_lists', 'min_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'discount_rate', title: fl('price_list_lines', 'discount_rate'), width: 100, editable: true },
    { dataIndex: 'effective_from', title: fl('price_lists', 'effective_date'), width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
    { dataIndex: 'effective_to', title: fl('price_lists', 'expiry_date'), width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('price_lists', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'code')} name="code"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'name')} name="name"><Input /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'effective_date')} name="effective_from" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'expiry_date')} name="effective_to" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'is_default')} name="is_default" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(PRICE_LIST_STATUS_OPTIONS, t)} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="price-list-lines" parentResource="price-lists" parentId={record?.id} parentFk="price_list_id" items={record?.lines ?? []} columns={lineColumns} title={pt('price_lists', 'edit')} productsMap={productsMap} />
    </Edit>
  );
};
