import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const SalesReturnShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'sales-returns' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`销售退货 ${record?.return_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="退货单号">{record?.return_number}</Descriptions.Item>
        <Descriptions.Item label="状态"><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="客户">{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label="货币">{record?.currency}</Descriptions.Item>
        <Descriptions.Item label="退货日期">
          <DateField value={record?.return_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="合计">
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>退货行</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'qty_returned', title: '退货数量', width: 100, align: 'right' },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right', render: (v, r: any) => <AmountDisplay value={v} currency={r.currency} /> },
              { dataIndex: 'amount', title: '行合计', width: 120, align: 'right', render: (v, r: any) => <AmountDisplay value={v} currency={r.currency} /> },
            ]}
          />
        </>
      )}
    </Show>
  );
};
