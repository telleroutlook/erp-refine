import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const WorkflowShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'workflows' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`工作流 ${record?.workflow_type ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="工作流类型">{record?.workflow_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          {record?.status ? <StatusTag status={record.status} /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="关联类型">{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联ID">{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="当前步骤">{record?.current_step || '-'}</Descriptions.Item>
        <Descriptions.Item label="发起人">{record?.started_by || '-'}</Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {record?.started_at ? <DateField value={record.started_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="完成时间">
          {record?.completed_at ? <DateField value={record.completed_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间" span={2}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="元数据" span={2}>
          {record?.metadata ? <pre style={{ margin: 0 }}>{JSON.stringify(record.metadata, null, 2)}</pre> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
