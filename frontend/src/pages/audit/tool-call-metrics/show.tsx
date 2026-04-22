import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const ToolCallMetricShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'tool-call-metrics' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="工具调用详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="工具名称">{record?.tool_name}</Descriptions.Item>
        <Descriptions.Item label="成功">{record?.success ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>}</Descriptions.Item>
        <Descriptions.Item label="缓存命中">{record?.cache_hit ? <Tag color="blue">命中</Tag> : <Tag>未命中</Tag>}</Descriptions.Item>
        <Descriptions.Item label="耗时(ms)">{record?.duration_ms}</Descriptions.Item>
        <Descriptions.Item label="会话ID">{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label="输入哈希">{record?.input_hash}</Descriptions.Item>
        {record?.error_message && <Descriptions.Item label="错误信息" span={2}>{record.error_message}</Descriptions.Item>}
        <Descriptions.Item label="时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
