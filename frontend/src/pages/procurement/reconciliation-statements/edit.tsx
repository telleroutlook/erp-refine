import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RECONCILIATION_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const ReconciliationStatementEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'reconciliation-statements' });
  const record = queryResult?.data?.data as any;
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'description', title: '描述', editable: true },
    { dataIndex: 'quantity', title: '数量', width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'line_amount', title: '行金额', width: 120, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑对账单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="对账单号" name="statement_no"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={RECONCILIATION_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id"><Select {...supplierProps} showSearch /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间开始" name="period_start" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间结束" name="period_end" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="reconciliation-lines" parentResource="reconciliation-statements" parentId={record?.id} parentFk="reconciliation_statement_id" items={record?.items ?? []} columns={itemColumns} title="对账明细" />
    </Edit>
  );
};
