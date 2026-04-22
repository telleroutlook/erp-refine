import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const TokenUsageShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'token-usage' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="Token使用详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="会话ID">{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label="模型">{record?.model}</Descriptions.Item>
        <Descriptions.Item label="变体">{record?.variant}</Descriptions.Item>
        <Descriptions.Item label="输入Token">{record?.input_tokens}</Descriptions.Item>
        <Descriptions.Item label="输出Token">{record?.output_tokens}</Descriptions.Item>
        <Descriptions.Item label="总Token">{record?.total_tokens}</Descriptions.Item>
        <Descriptions.Item label="费用估算">{record?.cost_estimate != null ? `$${Number(record.cost_estimate).toFixed(4)}` : '—'}</Descriptions.Item>
        <Descriptions.Item label="时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
