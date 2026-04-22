import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const ReconciliationStatementShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'reconciliation-statements' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`对账单 ${record?.statement_no ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="对账单号">{record?.statement_no}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label="货币">{record?.currency}</Descriptions.Item>
        <Descriptions.Item label="总金额"><AmountDisplay value={record?.total_amount} currency={record?.currency} /></Descriptions.Item>
        <Descriptions.Item label="已付金额"><AmountDisplay value={record?.paid_amount} currency={record?.currency} /></Descriptions.Item>
        <Descriptions.Item label="期间开始"><DateField value={record?.period_start} format="YYYY-MM-DD" /></Descriptions.Item>
        <Descriptions.Item label="期间结束"><DateField value={record?.period_end} format="YYYY-MM-DD" /></Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>对账明细</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: 'description', title: '描述' },
              { dataIndex: 'quantity', title: '数量', width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right' as const, render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'line_amount', title: '行金额', width: 120, align: 'right' as const, render: (v: any) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
