import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const ContractShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'contracts' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`合同 ${record?.contract_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="合同号">{record?.contract_number}</Descriptions.Item>
        <Descriptions.Item label="合同类型">{record?.contract_type}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="对方类型">{record?.party_type}</Descriptions.Item>
        <Descriptions.Item label="对方ID">{record?.party_id}</Descriptions.Item>
        <Descriptions.Item label="开始日期">
          <DateField value={record?.start_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="结束日期">
          {record?.end_date ? <DateField value={record.end_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label="合同金额">
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label="税率">{record?.tax_rate}</Descriptions.Item>
        <Descriptions.Item label="付款条件（天）">{record?.payment_terms}</Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label="描述" span={2}>{record.description}</Descriptions.Item>
        )}
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>合同行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'quantity', title: '数量', width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'tax_rate', title: '税率', width: 80 },
              { dataIndex: 'amount', title: '金额', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'status', title: '状态', width: 100, render: (v: string) => <StatusTag status={v} /> },
              { dataIndex: 'notes', title: '备注' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
