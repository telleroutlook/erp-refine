import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const SerialNumberShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'serial-numbers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`序列号 ${record?.serial_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="序列号">{record?.serial_number}</Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
