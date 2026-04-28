import React, { useState } from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RECONCILIATION_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ReconciliationStatementEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'reconciliation-statements' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'description', title: fl('reconciliation_lines', 'description'), editable: true },
    { dataIndex: 'quantity', title: fl('reconciliation_lines', 'quantity'), width: 80, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_price', title: fl('reconciliation_lines', 'unit_price'), width: 120, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'line_amount', title: fl('reconciliation_lines', 'line_amount'), width: 120, align: 'right',
      computed: (row) => { const q = Number(row['quantity']) || 0; const p = Number(row['unit_price']) || 0; return q * p ? (q * p).toFixed(2) : null; },
      render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('reconciliation_statements', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('reconciliation_statements', 'statement_no')} name="statement_no"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(RECONCILIATION_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('reconciliation_statements', 'supplier_id')} name="supplier_id"><Select {...supplierProps} showSearch /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('reconciliation_statements', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('reconciliation_statements', 'period_start')} name="period_start" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('reconciliation_statements', 'period_end')} name="period_end" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.reconciliationLines')} onChange={setItemsPayload} />
    </Edit>
  );
};
