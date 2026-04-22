import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { BUDGET_STATUS_OPTIONS, CURRENCY_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';

export const BudgetEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'budgets' });
  const { t } = useTranslation();
  const record = queryResult?.data?.data as any;

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'description', title: '说明', editable: true },
    { dataIndex: 'account_code', title: '科目编码', width: 120, editable: true },
    { dataIndex: 'period_month', title: '期间月份', width: 100, editable: true, inputType: 'number' },
    { dataIndex: 'planned_amount', title: '计划金额', width: 140, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'actual_amount', title: '实际金额', width: 140, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
    { dataIndex: 'variance_amount', title: '差异金额', width: 140, align: 'right', render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑预算">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预算名称" name="budget_name"><Input /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="预算类型" name="budget_type">
              <Select options={[{ value: 'annual', label: '年度' }, { value: 'quarterly', label: '季度' }, { value: 'monthly', label: '月度' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="年度" name="budget_year"><InputNumber style={FULL_WIDTH} min={2020} max={2030} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency"><Select options={CURRENCY_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status"><Select options={translateOptions(BUDGET_STATUS_OPTIONS, t)} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="budget-lines" parentResource="budgets" parentId={record?.id} parentFk="budget_id" items={record?.lines ?? []} columns={lineColumns} title="预算明细" />
    </Edit>
  );
};
