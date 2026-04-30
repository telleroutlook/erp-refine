import React, { useState } from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { VOUCHER_STATUS_OPTIONS, VOUCHER_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const VoucherEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'vouchers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: accountSelectProps } = useSelect({
    resource: 'account-subjects',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });

  const ENTRY_TYPE_OPTIONS = [
    { label: t('enums.balanceDirection.debit'), value: 'debit' },
    { label: t('enums.balanceDirection.credit'), value: 'credit' },
  ];

  const entryColumns: ColumnConfig[] = [
    { dataIndex: 'sequence', title: fl('voucher_entries', 'sequence'), width: 60 },
    { dataIndex: 'account_subject_id', title: fl('voucher_entries', 'account_subject_id'), editable: true, inputType: 'select', selectOptions: accountSelectProps.options as any, render: (_: any, r: any) => r?.account ? `${r.account.code} ${r.account.name}` : r?.account_subject_id },
    { dataIndex: 'entry_type', title: fl('voucher_entries', 'entry_type'), width: 80, editable: true, inputType: 'select', selectOptions: ENTRY_TYPE_OPTIONS, render: (v: any) => v === 'debit' ? t('enums.balanceDirection.debit') : t('enums.balanceDirection.credit') },
    { dataIndex: 'amount', title: fl('voucher_entries', 'amount'), width: 140, align: 'right', editable: true, inputType: 'number', render: (v: any) => <AmountDisplay value={v} /> },
    { dataIndex: 'summary', title: fl('voucher_entries', 'summary'), editable: true },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('vouchers', 'edit')}>
      <DocumentFlowPanel objectType="voucher" objectId={record?.id} />
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('vouchers', 'voucher_number')} name="voucher_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status"><Select options={translateOptions(VOUCHER_STATUS_OPTIONS, t)} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('vouchers', 'voucher_date')} name="voucher_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('vouchers', 'voucher_type')} name="voucher_type"><Select options={translateOptions(VOUCHER_TYPE_OPTIONS, t, 'enums.voucherType')} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable items={record?.entries ?? []} columns={entryColumns} title={t('sections.voucherEntries')} onChange={setItemsPayload} />
    </Edit>
  );
};
