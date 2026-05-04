import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { AGENT_SESSION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const AgentSessionList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'agent-sessions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(AGENT_SESSION_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.agentSessions')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="agent_id" title={fl('agent_sessions', 'agent_id')} width={160} />
        <Table.Column dataIndex="session_type" title={fl('agent_sessions', 'session_type')} width={120} />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="message_count" title={fl('agent_sessions', 'message_count')} width={80} align="right" />
        <Table.Column dataIndex="started_at" title={fl('agent_sessions', 'started_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column dataIndex="ended_at" title={fl('agent_sessions', 'ended_at')} width={160} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '—'} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('agent-sessions', r.id)} />} />
      </Table>
    </List>
  );
};
