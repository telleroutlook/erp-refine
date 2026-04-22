import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { StatusTag } from '../../../components/shared/StatusTag';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const ContractEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'contracts' });
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'quantity', title: '数量', width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'tax_rate', title: '税率', width: 80, editable: true, inputType: 'number' },
    { dataIndex: 'amount', title: '金额', width: 120, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'status', title: '状态', width: 100, editable: true, render: (v: any) => <StatusTag status={v} /> },
    { dataIndex: 'notes', title: '备注', editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑合同">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="合同号" name="contract_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="合同类型" name="contract_type"><Select options={CONTRACT_TYPE_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={CONTRACT_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="对方类型" name="party_type">
              <Select options={[{ value: 'customer', label: '客户' }, { value: 'supplier', label: '供应商' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="开始日期" name="start_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="结束日期" name="end_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="税率" name="tax_rate"><InputNumber style={FULL_WIDTH} min={0} max={100} precision={2} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="付款条件（天）" name="payment_terms"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="contract-items" parentResource="contracts" parentId={record?.id} parentFk="contract_id" items={record?.items ?? []} columns={itemColumns} title="合同行" />
    </Edit>
  );
};
