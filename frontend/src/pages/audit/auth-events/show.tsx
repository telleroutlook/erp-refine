import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const AuthEventShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'auth-events' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="认证事件详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="事件类型">{record?.event_type}</Descriptions.Item>
        <Descriptions.Item label="用户ID">{record?.user_id}</Descriptions.Item>
        <Descriptions.Item label="IP地址">{record?.ip_address}</Descriptions.Item>
        <Descriptions.Item label="User Agent" span={2}>{record?.user_agent}</Descriptions.Item>
        <Descriptions.Item label="时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        {record?.metadata && <Descriptions.Item label="元数据" span={2}><pre style={{ margin: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(record.metadata, null, 2)}</pre></Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
