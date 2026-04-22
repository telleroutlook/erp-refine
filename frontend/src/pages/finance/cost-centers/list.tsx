import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const CostCenterList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'cost-centers',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: '名称', placeholder: '搜索名称' },
    { type: 'search', field: 'code', label: '编码', placeholder: '搜索编码' },
  ];

  return (
    <List
      title="成本中心"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('cost-centers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="编码" width={120} />
        <Table.Column dataIndex="name" title="名称" />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('cost-centers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('cost-centers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
