import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const DefectCodeList: React.FC = () => {
  const { t } = useTranslation();
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
      title="缺陷代码"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('defect-codes')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="代码" width={120} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="category" title="分类" />
        <Table.Column dataIndex="severity" title="严重程度" />
        <Table.Column
          dataIndex="is_active"
          title="状态"
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
