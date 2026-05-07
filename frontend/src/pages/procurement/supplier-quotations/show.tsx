import React, { useState } from 'react';
import { useShow, useNavigation, useCustomMutation, useInvalidate } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Modal, Form, DatePicker, Input, message, Checkbox } from 'antd';
import { FileProtectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { API_URL } from '../../../constants/api';

export const SupplierQuotationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const { queryResult } = useShow({ resource: 'supplier-quotations' });
  const { mutate: doConvert, isLoading: converting } = useCustomMutation();
  const invalidate = useInvalidate();
  const record = queryResult.data?.data as any;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [form] = Form.useForm();

  const canConvert = record?.status === 'selected' || record?.status === 'evaluated';
  const lines = (record?.lines ?? []).filter((l: any) => !l.deleted_at);

  const handleConvert = () => {
    form.validateFields().then((values) => {
      const payload: any = {
        start_date: values.start_date?.format('YYYY-MM-DD') ?? undefined,
        end_date: values.end_date?.format('YYYY-MM-DD') ?? undefined,
        payment_terms: values.payment_terms || undefined,
        notes: values.notes || undefined,
      };
      if (selectedLineIds.length > 0 && selectedLineIds.length < lines.length) {
        payload.line_ids = selectedLineIds;
      }

      doConvert({
        url: `${API_URL}/supplier-quotations/${record.id}/convert-to-contract`,
        method: 'post',
        values: payload,
      }, {
        onSuccess: (resp: any) => {
          const contract = resp?.data?.data;
          message.success(t('messages.quotationConverted', {
            number: contract?.contract_number,
            defaultValue: `Contract ${contract?.contract_number ?? ''} created successfully`,
          }));
          setModalOpen(false);
          invalidate({ resource: 'supplier-quotations', invalidates: ['detail', 'list'] });
          if (contract?.id) {
            push(`/contracts/contracts/show/${contract.id}`);
          }
        },
      });
    });
  };

  const headerButtons = canConvert ? (
    <Button type="primary" icon={<FileProtectOutlined />} onClick={() => setModalOpen(true)}>
      {t('buttons.convertToContract', 'Convert to Contract')}
    </Button>
  ) : undefined;

  return (
    <Show
      title={`${pt('supplier_quotations', 'show')} ${record?.quotation_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('supplier_quotations', 'quotation_number')}>{record?.quotation_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('supplier_quotations', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('supplier_quotations', 'validity_date')}>
          {record?.validity_date ? <DateField value={record.validity_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        {record?.rfq && (
          <Descriptions.Item label={t('fields.rfq', 'RFQ')}>{record.rfq.rfq_number}</Descriptions.Item>
        )}
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {lines.length > 0 && (
        <>
          <Divider>{t('sections.quotationLines')}</Divider>
          <Table
            dataSource={lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('supplier_quotation_lines', 'product_id') },
              { dataIndex: 'qty_offered', title: fl('supplier_quotation_lines', 'qty_offered'), width: 100, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('supplier_quotation_lines', 'unit_price'), width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'total_price', title: fl('supplier_quotation_lines', 'total_price'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'lead_time_days', title: fl('supplier_quotation_lines', 'lead_time_days'), width: 80, align: 'right' as const },
              { dataIndex: 'description', title: fl('supplier_quotation_lines', 'description') },
            ]}
          />
        </>
      )}

      <Modal
        title={t('buttons.convertToContract', 'Convert to Contract')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleConvert}
        confirmLoading={converting}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={t('fields.selectLines', 'Select Lines (leave unchecked to include all)')}>
            <Checkbox.Group
              value={selectedLineIds}
              onChange={(vals) => setSelectedLineIds(vals as string[])}
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {lines.map((l: any) => (
                <Checkbox key={l.id} value={l.id}>
                  {l.product?.name ?? l.product?.code ?? l.product_id} — {l.qty_offered} × {l.unit_price}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="start_date" label={t('fields.start_date', 'Start Date')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label={t('fields.end_date', 'End Date')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payment_terms" label={t('fields.payment_terms', 'Payment Terms')}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t('common.notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};
