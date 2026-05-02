import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const DocumentRelationList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'document-relations',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'relation_type', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.documentRelations')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('document-relations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="from_object_type" title={fl('document_relations', 'from_object_type')} width={120} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="from_object_id" title={fl('document_relations', 'from_object_id')} width={200} ellipsis />
        <Table.Column dataIndex="relation_type" title={fl('document_relations', 'relation_type')} width={120} render={(v) => v ? t(`enums.relationTypes.${v}`, v) : '-'} />
        <Table.Column dataIndex="to_object_type" title={fl('document_relations', 'to_object_type')} width={120} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="to_object_id" title={fl('document_relations', 'to_object_id')} width={200} ellipsis />
        <Table.Column dataIndex="label" title={fl('document_relations', 'label')} />
        <Table.Column
          dataIndex="created_at"
          title={fl('document_relations', 'created_at')}
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('document-relations', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('document-relations', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
