import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const QualityStandardList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'quality-standards',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'standard_name', label: t('filters.search') },
  ];

  return (
    <List
      title="质量标准"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('quality-standards')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="standard_code" title="标准代码" width={160} />
        <Table.Column dataIndex="standard_name" title="标准名称" />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('quality-standards', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('quality-standards', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
