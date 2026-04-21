import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const VoucherShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'vouchers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`会计凭证 ${record?.voucher_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="凭证号">{record?.voucher_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="凭证日期">
          <DateField value={record?.voucher_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="凭证类型">{record?.voucher_type}</Descriptions.Item>
        <Descriptions.Item label="借方合计">
          <AmountDisplay value={record?.total_debit} currency="CNY" />
        </Descriptions.Item>
        <Descriptions.Item label="贷方合计">
          <AmountDisplay value={record?.total_credit} currency="CNY" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.entries && record.entries.length > 0 && (
        <>
          <Divider>凭证分录</Divider>
          <Table
            dataSource={record.entries}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'sequence', title: '序号', width: 60 },
              { dataIndex: ['account_subject', 'name'], title: '会计科目', render: (v: string, row: any) => v || row.account_subject_id },
              { dataIndex: 'entry_type', title: '借/贷', width: 80, render: (v: string) => (v === 'debit' ? '借' : '贷') },
              { dataIndex: 'amount', title: '金额', width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency="CNY" /> },
              { dataIndex: 'summary', title: '摘要' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
