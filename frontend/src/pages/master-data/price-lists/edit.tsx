import React, { useState } from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Switch, Row, Col, InputNumber } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS, PRICE_LIST_STATUS_OPTIONS, PRICE_TYPE_OPTIONS, PARTNER_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';
import { useSelect } from '@refinedev/antd';

export const PriceListEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish, form } = useForm({ resource: 'price-lists' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: productSelectProps, productsMap } = useProductSearch();
  const partnerType = Form.useWatch('partner_type', form);

  const { selectProps: customerSelectProps } = useSelect({
    resource: 'customers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 50 },
    queryOptions: { enabled: partnerType === 'customer' },
  });

  const { selectProps: supplierSelectProps } = useSelect({
    resource: 'suppliers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 50 },
    queryOptions: { enabled: partnerType === 'supplier' },
  });

  const partnerSelectProps = partnerType === 'customer' ? customerSelectProps : supplierSelectProps;

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('price_lists', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'unit_price', title: fl('price_lists', 'unit_price'), width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'min_quantity', title: fl('price_lists', 'min_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'discount_rate', title: fl('price_list_lines', 'discount_rate'), width: 100, editable: true, inputType: 'number' },
    { dataIndex: 'effective_from', title: fl('price_lists', 'effective_date'), width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
    { dataIndex: 'effective_to', title: fl('price_lists', 'expiry_date'), width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('price_lists', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'code')} name="code"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'name')} name="name"><Input /></Form.Item></Col>
          <Col xs={24} sm={24} md={8}><Form.Item label={fl('price_lists', 'price_type')} name="price_type"><Select options={translateOptions(PRICE_TYPE_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={8}><Form.Item label={fl('price_lists', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={8}><Form.Item label={fl('price_lists', 'priority')} name="priority"><InputNumber style={FULL_WIDTH} min={1} max={99} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'effective_date')} name="effective_from" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'expiry_date')} name="effective_to" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={8}><Form.Item label={fl('price_lists', 'partner_type')} name="partner_type"><Select options={translateOptions(PARTNER_TYPE_OPTIONS, t)} allowClear /></Form.Item></Col>
          <Col xs={24} sm={24} md={8}>
            <Form.Item label={fl('price_lists', 'partner_id')} name="partner_id">
              <Select {...partnerSelectProps} allowClear disabled={!partnerType} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={8}><Form.Item label={fl('price_lists', 'is_default')} name="is_default" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(PRICE_LIST_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('price_lists', 'description')} name="description"><Input /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.lines ?? []} columns={lineColumns} title={pt('price_lists', 'edit')} productsMap={productsMap} onChange={setItemsPayload} />
    </Edit>
  );
};
