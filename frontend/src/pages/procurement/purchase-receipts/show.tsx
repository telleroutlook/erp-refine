import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const PurchaseReceiptShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'purchase-receipts' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`采购收货 ${record?.receipt_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="收货单号">{record?.receipt_number}</Descriptions.Item>
        <Descriptions.Item label="状态"><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="采购订单号">{record?.purchase_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label="收货日期">
          <DateField value={record?.receipt_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>收货行</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '收货数量', width: 100, align: 'right' },
              { dataIndex: ['product', 'uom'], title: '单位', width: 80 },
            ]}
          />
        </>
      )}
    </Show>
  );
};
