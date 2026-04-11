import React from 'react';
import { useShow, Show } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { DateField } from '@refinedev/antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PurchaseOrderShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'purchase-orders' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`采购订单 ${record?.order_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="订单号">{record?.order_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.date')}>
          <DateField value={record?.order_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>订单行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'qty_ordered', title: '数量', width: 80, align: 'right' },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right', render: (v, r: any) => <AmountDisplay value={v} currency={r.currency} /> },
              { dataIndex: 'line_total', title: '行合计', width: 120, align: 'right', render: (v, r: any) => <AmountDisplay value={v} currency={r.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
