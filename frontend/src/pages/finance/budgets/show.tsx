import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const BudgetShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'budgets' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`预算 ${record?.budget_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="预算名称">{record?.budget_name}</Descriptions.Item>
        <Descriptions.Item label="预算类型">{record?.budget_type}</Descriptions.Item>
        <Descriptions.Item label="年度">{record?.budget_year}</Descriptions.Item>
        <Descriptions.Item label="货币">{record?.currency}</Descriptions.Item>
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
          <Divider>预算明细</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'description', title: '说明' },
              { dataIndex: 'account_code', title: '科目编码', width: 120 },
              { dataIndex: 'period_month', title: '期间月份', width: 100 },
              { dataIndex: 'planned_amount', title: '计划金额', width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'actual_amount', title: '实际金额', width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'variance_amount', title: '差异金额', width: 140, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
