import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel } from '../../../hooks';

export const BudgetShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'budgets' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.budgets')} ${record?.budget_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('budgets', 'budget_name')}>{record?.budget_name}</Descriptions.Item>
        <Descriptions.Item label={fl('budgets', 'budget_type')}>{record?.budget_type}</Descriptions.Item>
        <Descriptions.Item label={fl('budgets', 'budget_year')}>{record?.budget_year}</Descriptions.Item>
        <Descriptions.Item label={fl('budgets', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.budgetLines')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'description', title: fl('budget_lines', 'description') },
              { dataIndex: 'account_code', title: fl('budget_lines', 'account_code'), width: 120 },
              { dataIndex: 'period_month', title: fl('budgets', 'period_month'), width: 100 },
              { dataIndex: 'planned_amount', title: fl('budget_lines', 'planned_amount'), width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'actual_amount', title: fl('budget_lines', 'actual_amount'), width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'variance_amount', title: fl('budget_lines', 'variance_amount'), width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
