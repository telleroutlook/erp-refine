import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

const RISK_COLORS: Record<string, string> = { D0: 'green', D1: 'blue', D2: 'orange', D3: 'red', D4: 'purple', D5: 'magenta' };

export const AgentDecisionList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'agent-decisions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.agentDecisions')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="agent_id" title="Agent" width={140} />
        <Table.Column dataIndex="risk_level" title="风险等级" width={100} render={(v) => <Tag color={RISK_COLORS[v] ?? 'default'}>{v}</Tag>} />
        <Table.Column dataIndex="approval_status" title="审批状态" width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="execution_status" title="执行状态" width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="confidence" title="置信度" width={80} align="right" render={(v) => v != null ? `${(v * 100).toFixed(0)}%` : '—'} />
        <Table.Column dataIndex="created_at" title="时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('agent-decisions', r.id)} />} />
      </Table>
    </List>
  );
};
