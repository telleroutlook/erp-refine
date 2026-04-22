import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PRICE_LIST_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const PriceListList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'price-lists',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(PRICE_LIST_STATUS_OPTIONS, t) },
  ];

  return (
    <List
      title="价格表"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('price-lists')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="编号" width={120} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex="currency" title="货币" />
        <Table.Column
          dataIndex="effective_from"
          title="生效日期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="effective_to"
          title="到期日期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="is_default"
          title="默认"
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('price-lists', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('price-lists', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
