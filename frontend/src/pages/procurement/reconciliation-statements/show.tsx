import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ReconciliationStatementShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'reconciliation-statements' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('reconciliation_statements', 'show')} ${record?.statement_no ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('reconciliation_statements', 'statement_no')}>{record?.statement_no}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'total_amount')}><AmountDisplay value={record?.total_amount} currency={record?.currency} /></Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'paid_amount')}><AmountDisplay value={record?.paid_amount} currency={record?.currency} /></Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'period_start')}><DateField value={record?.period_start} format="YYYY-MM-DD" /></Descriptions.Item>
        <Descriptions.Item label={fl('reconciliation_statements', 'period_end')}><DateField value={record?.period_end} format="YYYY-MM-DD" /></Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.reconciliationLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: 'description', title: fl('reconciliation_lines', 'description') },
              { dataIndex: 'quantity', title: fl('reconciliation_lines', 'quantity'), width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('reconciliation_lines', 'unit_price'), width: 120, align: 'right' as const, render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'line_amount', title: fl('reconciliation_lines', 'line_amount'), width: 120, align: 'right' as const, render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
