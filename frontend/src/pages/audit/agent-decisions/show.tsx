import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

const RISK_COLORS: Record<string, string> = { D0: 'green', D1: 'blue', D2: 'orange', D3: 'red', D4: 'purple', D5: 'magenta' };

export const AgentDecisionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'agent-decisions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.agentDecisions')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="Agent ID">{record?.agent_id}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'session_id')}>{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'risk_level')}><Tag color={RISK_COLORS[record?.risk_level] ?? 'default'}>{record?.risk_level}</Tag></Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'confidence')}>{record?.confidence != null ? `${(record.confidence * 100).toFixed(0)}%` : '—'}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'approval_status')}><StatusTag status={record?.approval_status} /></Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'execution_status')}><StatusTag status={record?.execution_status} /></Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'model')}>{record?.model_profile}</Descriptions.Item>
        <Descriptions.Item label={fl('agent_decisions', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        {record?.decision && <Descriptions.Item label={fl('agent_decisions', 'decision')} span={2}>{record.decision}</Descriptions.Item>}
        {record?.reasoning_summary && <Descriptions.Item label={fl('agent_decisions', 'reasoning_summary')} span={2}>{record.reasoning_summary}</Descriptions.Item>}
        {record?.outcome && <Descriptions.Item label={fl('agent_decisions', 'outcome')} span={2}>{record.outcome}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
