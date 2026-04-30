import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { useFieldLabel } from '../../../hooks';

export const VoucherShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'vouchers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.vouchers')} ${record?.voucher_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('vouchers', 'voucher_number')}>{record?.voucher_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('vouchers', 'voucher_date')}>
          <DateField value={record?.voucher_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('vouchers', 'voucher_type')}>{record?.voucher_type}</Descriptions.Item>
        <Descriptions.Item label={fl('vouchers', 'total_debit')}>
          <AmountDisplay value={record?.total_debit} currency="CNY" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('vouchers', 'total_credit')}>
          <AmountDisplay value={record?.total_credit} currency="CNY" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.entries && record.entries.length > 0 && (
        <>
          <Divider>{t('sections.voucherEntries')}</Divider>
          <Table
            dataSource={record.entries}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'sequence', title: fl('voucher_entries', 'sequence'), width: 60 },
              { dataIndex: ['account', 'name'], title: fl('voucher_entries', 'account_subject_id'), render: (v: string, row: any) => v || row.account_subject_id },
              { dataIndex: 'entry_type', title: fl('voucher_entries', 'entry_type'), width: 80, render: (v: string) => (v === 'debit' ? t('enums.balanceDirection.debit') : t('enums.balanceDirection.credit')) },
              { dataIndex: 'amount', title: fl('voucher_entries', 'amount'), width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency="CNY" /> },
              { dataIndex: 'summary', title: fl('voucher_entries', 'summary') },
            ]}
          />
        </>
      )}
      <DocumentFlowPanel objectType="voucher" objectId={record?.id} defaultOpen={true} />
    </Show>
  );
};
