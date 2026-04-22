import React from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Switch, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS, PRICE_LIST_STATUS_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const PriceListEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'price-lists' });
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: '产品', editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'min_quantity', title: '最小数量', width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'discount_rate', title: '折扣率', width: 100, editable: true },
    { dataIndex: 'effective_from', title: '生效日期', width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
    { dataIndex: 'effective_to', title: '到期日期', width: 120, editable: true, inputType: 'date', render: (v: any) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑价格表">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="编号" name="code"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="名称" name="name"><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="生效日期" name="effective_from" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="到期日期" name="effective_to" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="默认" name="is_default" valuePropName="checked"><Switch /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={PRICE_LIST_STATUS_OPTIONS} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="price-list-lines" parentResource="price-lists" parentId={record?.id} parentFk="price_list_id" items={record?.lines ?? []} columns={lineColumns} title="价格明细" />
    </Edit>
  );
};
