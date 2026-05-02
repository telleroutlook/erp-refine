import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const DefectCodeList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'defect-codes',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'code', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('defect-codes.defect-codes')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('defect-codes')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('defect_codes', 'code')} width={120} />
        <Table.Column dataIndex="name" title={fl('defect_codes', 'name')} />
        <Table.Column dataIndex="category" title={fl('defect_codes', 'category')} render={(v) => v ? t(`enums.defectCategory.${v}`, v) : '-'} />
        <Table.Column dataIndex="severity" title={fl('defect_codes', 'severity')} render={(v) => v ? t(`enums.defectSeverity.${v}`, v) : '-'} />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status')}
          width={100}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('defect-codes', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('defect-codes', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
