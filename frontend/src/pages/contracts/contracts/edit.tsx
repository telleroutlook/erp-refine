import React, { useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { StatusTag } from '../../../components/shared/StatusTag';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

export const ContractEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'contracts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('contracts', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'quantity', title: fl('contracts', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('contracts', 'unit_price'), width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'tax_rate', title: fl('contracts', 'tax_rate'), width: 80, editable: true, inputType: 'number' },
    { dataIndex: 'amount', title: fl('contracts', 'amount'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'status', title: fl('contracts', 'status'), width: 100, editable: true, render: (v: any) => <StatusTag status={v} /> },
    { dataIndex: 'notes', title: fl('contracts', 'notes'), editable: true },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('contracts', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'contract_number')} name="contract_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'contract_type')} name="contract_type"><Select options={translateOptions(CONTRACT_TYPE_OPTIONS, t, 'enums.contractType')} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(CONTRACT_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'party_type')} name="party_type"><Select options={[{ value: 'customer', label: t('enums.partyType.customer') }, { value: 'supplier', label: t('enums.partyType.supplier') }]} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'start_date')} name="start_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'end_date')} name="end_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'tax_rate')} name="tax_rate"><InputNumber style={FULL_WIDTH} min={0} max={100} precision={2} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('contracts', 'payment_terms')} name="payment_terms"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item></Col>
          <Col span={24}><Form.Item label={fl('contracts', 'description')} name="description"><Input.TextArea rows={3} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={pt('contracts', 'edit')} productsMap={productsMap} priceField="sale_price" onChange={setItemsPayload} />
    </Edit>
  );
};
