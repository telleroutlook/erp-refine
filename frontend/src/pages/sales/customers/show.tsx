import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const CustomerShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'customers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`客户 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="客户编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
        <Descriptions.Item label="联系人">{record?.contact_name}</Descriptions.Item>
        <Descriptions.Item label="电话">{record?.phone}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{record?.email}</Descriptions.Item>
        {record?.address && (
          <Descriptions.Item label="地址" span={2}>{record.address}</Descriptions.Item>
        )}
        {record?.notes && (
          <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
