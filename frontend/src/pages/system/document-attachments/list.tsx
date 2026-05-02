import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const DocumentAttachmentList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'document-attachments',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'file_name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.documentAttachments')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('document-attachments')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="file_name" title={fl('document_attachments', 'file_name')} />
        <Table.Column dataIndex="entity_type" title={fl('document_attachments', 'entity_type')} width={120} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="entity_id" title={fl('document_attachments', 'entity_id')} width={200} ellipsis />
        <Table.Column dataIndex="mime_type" title={fl('document_attachments', 'mime_type')} width={140} />
        <Table.Column
          dataIndex="file_size"
          title={fl('document_attachments', 'file_size')}
          width={120}
          render={(v) => formatFileSize(v)}
        />
        <Table.Column dataIndex="uploaded_by" title={fl('document_attachments', 'uploaded_by')} width={200} ellipsis />
        <Table.Column
          dataIndex="created_at"
          title={fl('document_attachments', 'created_at')}
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
