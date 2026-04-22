import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const CarrierList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'carriers',
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
  ];

  const carrierTypeLabels: Record<string, string> = {
    express: '快递',
    freight: '货运',
    ltl: 'LTL',
    ftl: 'FTL',
    ocean: '海运',
    air: '空运',
  };

  return (
    <List
      title="承运商管理"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('carriers')}>
          新建承运商
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="编号" width={120} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column
          dataIndex="carrier_type"
          title="类型"
          width={100}
          render={(v) => carrierTypeLabels[v] ?? v}
        />
        <Table.Column dataIndex="contact" title="联系人" width={120} />
        <Table.Column dataIndex="phone" title="电话" width={140} />
        <Table.Column
          dataIndex="is_active"
          title="状态"
          width={80}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column
          title="操作"
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('carriers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('carriers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
