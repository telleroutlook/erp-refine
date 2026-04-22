import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const DocumentRelationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'document-relations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.documentRelations')} ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('document_relations', 'from_object_type')}>{record?.from_object_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'from_object_id')}>{record?.from_object_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'relation_type')}>{record?.relation_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'label')}>{record?.label || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'to_object_type')}>{record?.to_object_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'to_object_id')}>{record?.to_object_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'metadata')} span={2}>
          {record?.metadata ? <pre style={{ margin: 0 }}>{JSON.stringify(record.metadata, null, 2)}</pre> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('document_relations', 'created_at')}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
