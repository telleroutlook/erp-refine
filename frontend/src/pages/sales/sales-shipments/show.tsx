import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const SalesShipmentShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'sales-shipments' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`销售发货 ${record?.shipment_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="发货单号">{record?.shipment_number}</Descriptions.Item>
        <Descriptions.Item label="状态"><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="销售订单号">{record?.sales_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label="客户">{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label="发货日期">
          <DateField value={record?.shipment_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>发货行</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '发货数量', width: 100, align: 'right' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
