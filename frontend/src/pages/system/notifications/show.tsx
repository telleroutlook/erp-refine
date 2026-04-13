import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';

const typeColors: Record<string, string> = {
  info: 'blue', warning: 'orange', action_required: 'red', approval: 'purple', system: 'default',
};
const typeLabels: Record<string, string> = {
  info: '通知', warning: '警告', action_required: '待处理', approval: '待审批', system: '系统',
};

export const NotificationShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'notifications' });
  const record = queryResult?.data?.data as any;

  return (
    <Show title="通知详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="类型">
          <Tag color={typeColors[record?.notification_type] ?? 'default'}>
            {typeLabels[record?.notification_type] ?? record?.notification_type}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={record?.is_read ? 'default' : 'blue'}>{record?.is_read ? '已读' : '未读'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="标题" span={2}>{record?.title}</Descriptions.Item>
        <Descriptions.Item label="内容" span={2}>{record?.body || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联对象">{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联ID">{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{record?.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        <Descriptions.Item label="已读时间">{record?.read_at ? dayjs(record.read_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
