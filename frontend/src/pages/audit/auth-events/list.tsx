import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const AuthEventList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'auth-events',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.authEvents')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="event_type" title="事件类型" width={160} />
        <Table.Column dataIndex="user_id" title="用户ID" width={280} ellipsis />
        <Table.Column dataIndex="ip_address" title="IP地址" width={140} />
        <Table.Column dataIndex="user_agent" title="User Agent" ellipsis />
        <Table.Column dataIndex="created_at" title="时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('auth-events', r.id)} />} />
      </Table>
    </List>
  );
};
