import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigation, useCustomMutation, useInvalidate } from '@refinedev/core';
import dayjs from 'dayjs';

const typeColors: Record<string, string> = {
  info: 'blue', warning: 'orange', action_required: 'red', approval: 'purple', system: 'default',
};
const typeLabels: Record<string, string> = {
  info: '通知', warning: '警告', action_required: '待处理', approval: '待审批', system: '系统',
};

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const NotificationList: React.FC = () => {
  const { show } = useNavigation();
  const { mutate: markRead } = useCustomMutation();
  const invalidate = useInvalidate();

  const { tableProps } = useTable({
    resource: 'notifications',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const handleMarkRead = (id: string) => {
    markRead({
      url: `${API_URL}/notifications/${id}/read`,
      method: 'post',
      values: {},
    }, {
      onSuccess: () => invalidate({ resource: 'notifications', invalidates: ['list'] }),
    });
  };

  const handleMarkAllRead = () => {
    markRead({
      url: `${API_URL}/notifications/read-all`,
      method: 'post',
      values: {},
    }, {
      onSuccess: () => invalidate({ resource: 'notifications', invalidates: ['list'] }),
    });
  };

  return (
    <List
      title="通知中心"
      headerButtons={
        <Button onClick={handleMarkAllRead}>全部标为已读</Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex="notification_type"
          title="类型"
          width={100}
          render={(v) => <Tag color={typeColors[v] ?? 'default'}>{typeLabels[v] ?? v}</Tag>}
        />
        <Table.Column dataIndex="title" title="标题" />
        <Table.Column dataIndex="body" title="内容" ellipsis />
        <Table.Column
          dataIndex="is_read"
          title="状态"
          width={80}
          render={(v) => <Tag color={v ? 'default' : 'blue'}>{v ? '已读' : '未读'}</Tag>}
        />
        <Table.Column
          dataIndex="created_at"
          title="时间"
          width={160}
          render={(v) => dayjs(v).format('YYYY-MM-DD HH:mm')}
        />
        <Table.Column
          title="操作"
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('notifications', record.id)} />
              {!record.is_read && (
                <Button size="small" icon={<CheckOutlined />} onClick={() => handleMarkRead(record.id)} />
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
