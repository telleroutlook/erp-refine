import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Tag, Button, Space } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigation, useCustomMutation, useInvalidate } from '@refinedev/core';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NOTIFICATION_TYPE_COLORS } from '../../../constants/options';
import { API_URL } from '../../../constants/api';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const NotificationList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: markRead } = useCustomMutation();
  const invalidate = useInvalidate();

  const { tableProps, setFilters } = useTable({
    resource: 'notifications',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

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
      title={t('menu.notifications')}
      headerButtons={
        <Button onClick={handleMarkAllRead}>{t('notifications.markAllRead', '全部标为已读')}</Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex="notification_type"
          title={t('filters.type')}
          width={100}
          render={(v) => <Tag color={NOTIFICATION_TYPE_COLORS[v] ?? 'default'}>{String(t(`enums.notificationType.${v}`, v))}</Tag>}
        />
        <Table.Column dataIndex="title" title={t('notifications.title', '标题')} />
        <Table.Column dataIndex="body" title={t('notifications.body', '内容')} ellipsis />
        <Table.Column
          dataIndex="is_read"
          title={t('common.status')}
          width={80}
          render={(v) => <Tag color={v ? 'default' : 'blue'}>{v ? t('notifications.read', '已读') : t('notifications.unread', '未读')}</Tag>}
        />
        <Table.Column
          dataIndex="created_at"
          title={t('notifications.time', '时间')}
          width={160}
          render={(v) => dayjs(v).format('YYYY-MM-DD HH:mm')}
        />
        <Table.Column
          title={t('common.actions')}
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
