import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AgentSessionShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'agent-sessions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`Agent会话 ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="Agent ID">{record?.agent_id}</Descriptions.Item>
        <Descriptions.Item label="会话类型">{record?.session_type}</Descriptions.Item>
        <Descriptions.Item label="用户ID">{record?.user_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="消息数">{record?.message_count}</Descriptions.Item>
        <Descriptions.Item label="开始时间"><DateField value={record?.started_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label="结束时间">{record?.ended_at ? <DateField value={record.ended_at} format="YYYY-MM-DD HH:mm:ss" /> : '—'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
