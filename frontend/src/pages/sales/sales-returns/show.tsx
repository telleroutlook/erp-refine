import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SalesReturnShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'sales-returns' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('sales_returns', 'show')} ${record?.return_number ?? ''}`} isLoading={queryResult.isLoading}>
      <DocumentFlowPanel objectType="sales_return" objectId={record?.id} />
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('sales_returns', 'return_number')}>{record?.return_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('sales_returns', 'customer_id')}>{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('sales_returns', 'return_date')}>
          <DateField value={record?.return_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.sales_order?.currency} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.returnLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('sales_return_items', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('sales_return_items', 'quantity'), width: 100, align: 'right' },
              { dataIndex: 'unit_price', title: fl('sales_return_items', 'unit_price'), width: 100, align: 'right', render: (v: number) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
              { dataIndex: 'amount', title: fl('sales_return_items', 'line_total'), width: 120, align: 'right', render: (v: number) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
