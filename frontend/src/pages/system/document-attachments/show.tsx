import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const DocumentAttachmentShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'document-attachments' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.documentAttachments')} ${record?.file_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('document_attachments', 'file_name')}>{record?.file_name}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'mime_type')}>{record?.mime_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'file_size')}>{formatFileSize(record?.file_size)}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'file_path')}>{record?.file_path || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'relation_type')}>{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'entity_id')}>{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'uploaded_by')}>{record?.uploaded_by || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_attachments', 'created_at')}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
