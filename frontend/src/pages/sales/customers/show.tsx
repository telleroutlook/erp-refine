import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const CustomerShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'customers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`客户 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="客户编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="联系人">{record?.contact}</Descriptions.Item>
        <Descriptions.Item label="电话">{record?.phone}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{record?.email}</Descriptions.Item>
        {record?.street && (
          <Descriptions.Item label="地址" span={2}>{record.street}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
