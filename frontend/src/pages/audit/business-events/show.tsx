import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'magenta' };

export const BusinessEventShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'business-events' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="业务事件详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="事件类型">{record?.event_type}</Descriptions.Item>
        <Descriptions.Item label="实体类型">{record?.entity_type}</Descriptions.Item>
        <Descriptions.Item label="实体ID">{record?.entity_id}</Descriptions.Item>
        <Descriptions.Item label="级别"><Tag color={SEVERITY_COLORS[record?.severity] ?? 'default'}>{record?.severity}</Tag></Descriptions.Item>
        <Descriptions.Item label="来源系统">{record?.source_system}</Descriptions.Item>
        <Descriptions.Item label="已处理">{record?.processed ? <Tag color="success">是</Tag> : <Tag>否</Tag>}</Descriptions.Item>
        <Descriptions.Item label="发生时间"><DateField value={record?.occurred_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        {record?.payload && <Descriptions.Item label="负载数据" span={2}><pre style={{ margin: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(record.payload, null, 2)}</pre></Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
