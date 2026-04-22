import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AgentSessionList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'agent-sessions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.agentSessions')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="agent_id" title="Agent" width={160} />
        <Table.Column dataIndex="session_type" title="类型" width={120} />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="message_count" title="消息数" width={80} align="right" />
        <Table.Column dataIndex="started_at" title="开始时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column dataIndex="ended_at" title="结束时间" width={160} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '—'} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('agent-sessions', r.id)} />} />
      </Table>
    </List>
  );
};
