import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { VOUCHER_STATUS_OPTIONS, VOUCHER_TYPE_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

const ENTRY_TYPE_OPTIONS = [
  { label: '借', value: 'debit' },
  { label: '贷', value: 'credit' },
];

export const VoucherEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'vouchers' });
  const record = queryResult?.data?.data as any;
  const { data: accountsData } = useList({ resource: 'account-subjects', pagination: { pageSize: 500 } });
  const accountOptions = (accountsData?.data ?? []).map((a: any) => ({ label: `${a.code} - ${a.name}`, value: a.id }));

  const entryColumns: ColumnConfig[] = [
    { dataIndex: 'sequence', title: '序号', width: 60 },
    { dataIndex: 'account_subject_id', title: '会计科目', editable: true, inputType: 'select', selectOptions: accountOptions, render: (_: any, r: any) => r?.account ? `${r.account.code} ${r.account.name}` : r?.account_subject_id },
    { dataIndex: 'entry_type', title: '借/贷', width: 80, editable: true, inputType: 'select', selectOptions: ENTRY_TYPE_OPTIONS, render: (v: any) => v === 'debit' ? '借' : '贷' },
    { dataIndex: 'amount', title: '金额', width: 140, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} /> },
    { dataIndex: 'summary', title: '摘要', editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑会计凭证">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="凭证号" name="voucher_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={VOUCHER_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="凭证日期" name="voucher_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="凭证类型" name="voucher_type"><Select options={VOUCHER_TYPE_OPTIONS} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="voucher-entries" parentResource="vouchers" parentId={record?.id} parentFk="voucher_id" items={record?.entries ?? []} columns={entryColumns} title="凭证分录" />
    </Edit>
  );
};
