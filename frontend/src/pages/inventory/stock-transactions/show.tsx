import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';

export const StockTransactionShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'stock-transactions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="库存流水详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="日期">
          <DateField value={record?.transaction_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="类型">{record?.transaction_type}</Descriptions.Item>
        <Descriptions.Item label="数量">{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label="关联类型">{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label="关联单号">{record?.reference_id}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>
        )}
        <Descriptions.Item label="创建人">{record?.created_by}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
