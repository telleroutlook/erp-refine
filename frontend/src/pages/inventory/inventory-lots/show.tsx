import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const InventoryLotShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-lots' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`批次 ${record?.lot_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="批次号">{record?.lot_number}</Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="数量">{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label="生产日期">
          {record?.manufacture_date ? <DateField value={record.manufacture_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="到期日期">
          {record?.expiry_date ? <DateField value={record.expiry_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
