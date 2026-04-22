import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';

export const DocumentRelationShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'document-relations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`单据关联 ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="来源类型">{record?.from_object_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="来源ID">{record?.from_object_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联类型">{record?.relation_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="标签">{record?.label || '-'}</Descriptions.Item>
        <Descriptions.Item label="目标类型">{record?.to_object_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="目标ID">{record?.to_object_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="元数据" span={2}>
          {record?.metadata ? <pre style={{ margin: 0 }}>{JSON.stringify(record.metadata, null, 2)}</pre> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
