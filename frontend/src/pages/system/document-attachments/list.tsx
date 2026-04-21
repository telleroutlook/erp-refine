import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const DocumentAttachmentList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'document-attachments',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="文档附件"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('document-attachments')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="file_name" title="文件名" />
        <Table.Column dataIndex="entity_type" title="关联类型" width={120} />
        <Table.Column dataIndex="entity_id" title="关联ID" width={200} ellipsis />
        <Table.Column dataIndex="mime_type" title="MIME类型" width={140} />
        <Table.Column
          dataIndex="file_size"
          title="文件大小"
          width={120}
          render={(v) => formatFileSize(v)}
        />
        <Table.Column dataIndex="uploaded_by" title="上传人" width={200} ellipsis />
        <Table.Column
          dataIndex="created_at"
          title="创建时间"
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('document-attachments', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('document-attachments', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
