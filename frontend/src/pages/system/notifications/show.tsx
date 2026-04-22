import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NOTIFICATION_TYPE_COLORS } from '../../../constants/options';

export const NotificationShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'notifications' });
  const record = queryResult?.data?.data as any;

  return (
    <Show title={t('notifications.detail', '通知详情')} isLoading={queryResult.isLoading}>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
        <Descriptions.Item label={t('filters.type')}>
          <Tag color={NOTIFICATION_TYPE_COLORS[record?.notification_type] ?? 'default'}>
            {String(t(`enums.notificationType.${record?.notification_type}`, record?.notification_type))}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <Tag color={record?.is_read ? 'default' : 'blue'}>{record?.is_read ? t('notifications.read', '已读') : t('notifications.unread', '未读')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('notifications.title', '标题')} span={2}>{record?.title}</Descriptions.Item>
        <Descriptions.Item label={t('notifications.body', '内容')} span={2}>{record?.body || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('notifications.entityType', '关联对象')}>{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('notifications.entityId', '关联ID')}>{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('notifications.createdAt', '创建时间')}>{record?.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        <Descriptions.Item label={t('notifications.readAt', '已读时间')}>{record?.read_at ? dayjs(record.read_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
