import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { BUDGET_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const BudgetEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'budgets' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'description', title: fl('budget_lines', 'description'), editable: true },
    { dataIndex: 'account_code', title: fl('budget_lines', 'account_code'), width: 120, editable: true },
    { dataIndex: 'period_month', title: fl('budgets', 'period_month'), width: 100, editable: true, inputType: 'number' },
    { dataIndex: 'planned_amount', title: fl('budget_lines', 'planned_amount'), width: 140, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'actual_amount', title: fl('budget_lines', 'actual_amount'), width: 140, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'variance_amount', title: fl('budget_lines', 'variance_amount'), width: 140, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('budgets', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('budgets', 'budget_name')} name="budget_name"><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('budgets', 'budget_type')} name="budget_type">
              <Select options={[{ value: 'annual', label: t('enums.budgetType.annual') }, { value: 'quarterly', label: t('enums.budgetType.quarterly') }, { value: 'monthly', label: t('enums.budgetType.monthly') }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('budgets', 'budget_year')} name="budget_year"><InputNumber style={FULL_WIDTH} min={2020} max={2030} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('budgets', 'currency')} name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status"><Select options={translateOptions(BUDGET_STATUS_OPTIONS, t)} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="budget-lines" parentResource="budgets" parentId={record?.id} parentFk="budget_id" items={record?.lines ?? []} columns={lineColumns} title={t('sections.budgetLines')} />
    </Edit>
  );
};
