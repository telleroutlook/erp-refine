import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { NOTIFICATION_TYPE_COLORS } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const NotificationShow: React.FC = () => {
  const fl = useFieldLabel();
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'notifications' });
  const record = queryResult?.data?.data as any;

  return (
    <Show title={t('menu.notifications')} isLoading={queryResult.isLoading}>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
        <Descriptions.Item label={t('filters.type')}>
          <Tag color={NOTIFICATION_TYPE_COLORS[record?.notification_type] ?? 'default'}>
            {String(t(`enums.notificationType.${record?.notification_type}`, record?.notification_type))}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <Tag color={record?.is_read ? 'default' : 'blue'}>{record?.is_read ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'title')} span={2}>{record?.title}</Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'body')} span={2}>{record?.body || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'entity_type')}>{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'entity_id')}>{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'created_at')}>{record?.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('notifications', 'read_at')}>{record?.read_at ? dayjs(record.read_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
