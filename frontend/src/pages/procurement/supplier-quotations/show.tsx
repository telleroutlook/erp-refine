import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const SupplierQuotationShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'supplier-quotations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`供应商报价 ${record?.quotation_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="报价单号">{record?.quotation_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label="有效期">
          {record?.validity_date ? <DateField value={record.validity_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>报价行</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'qty_offered', title: '报价数量', width: 100, align: 'right' as const },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'total_price', title: '合计', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'lead_time_days', title: '交期(天)', width: 80, align: 'right' as const },
              { dataIndex: 'description', title: '描述' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
