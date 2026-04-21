import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const DocumentAttachmentShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'document-attachments' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`文档附件 ${record?.file_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="文件名">{record?.file_name}</Descriptions.Item>
        <Descriptions.Item label="MIME类型">{record?.mime_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="文件大小">{formatFileSize(record?.file_size)}</Descriptions.Item>
        <Descriptions.Item label="文件路径">{record?.file_path || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联类型">{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联ID">{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label="上传人">{record?.uploaded_by || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
