import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AgentSessionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'agent-sessions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.agentSessions')} ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="Agent ID">{record?.agent_id}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_sessions', 'session_type')}>{record?.session_type}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_sessions', 'user_id')}>{record?.user_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('agent_sessions', 'message_count')}>{record?.message_count}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_sessions', 'started_at')}><DateField value={record?.started_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label={fl('agent_sessions', 'ended_at')}>{record?.ended_at ? <DateField value={record.ended_at} format="YYYY-MM-DD HH:mm:ss" /> : '—'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
