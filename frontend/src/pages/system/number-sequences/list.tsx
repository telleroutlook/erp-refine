import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const NumberSequenceList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'number-sequences',
    sorters: { initial: [{ field: 'sequence_name', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'sequence_name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List title={t('menu.numberSequences')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="sequence_name" title="序列名称" width={200} />
        <Table.Column dataIndex="prefix" title="前缀" width={120} />
        <Table.Column dataIndex="current_value" title="当前值" width={120} align="right" />
        <Table.Column dataIndex="padding" title="补零位数" width={100} align="right" />
        <Table.Column dataIndex="increment_by" title="步长" width={80} align="right" />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('number-sequences', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('number-sequences', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
