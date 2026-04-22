import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

const RISK_COLORS: Record<string, string> = { D0: 'green', D1: 'blue', D2: 'orange', D3: 'red', D4: 'purple', D5: 'magenta' };

export const AgentDecisionShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'agent-decisions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="Agent决策详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="Agent ID">{record?.agent_id}</Descriptions.Item>
        <Descriptions.Item label="会话ID">{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label="风险等级"><Tag color={RISK_COLORS[record?.risk_level] ?? 'default'}>{record?.risk_level}</Tag></Descriptions.Item>
        <Descriptions.Item label="置信度">{record?.confidence != null ? `${(record.confidence * 100).toFixed(0)}%` : '—'}</Descriptions.Item>
        <Descriptions.Item label="审批状态"><StatusTag status={record?.approval_status} /></Descriptions.Item>
        <Descriptions.Item label="执行状态"><StatusTag status={record?.execution_status} /></Descriptions.Item>
        <Descriptions.Item label="模型">{record?.model_profile}</Descriptions.Item>
        <Descriptions.Item label="时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        {record?.decision && <Descriptions.Item label="决策" span={2}>{record.decision}</Descriptions.Item>}
        {record?.reasoning_summary && <Descriptions.Item label="推理摘要" span={2}>{record.reasoning_summary}</Descriptions.Item>}
        {record?.outcome && <Descriptions.Item label="结果" span={2}>{record.outcome}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
