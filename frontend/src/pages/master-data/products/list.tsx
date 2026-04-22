import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PRODUCT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const ProductList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'products',
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
    { type: 'search', field: 'code', label: t('filters.code') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(PRODUCT_STATUS_OPTIONS, t) },
  ];

  return (
    <List
      title={t('menu.products')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('products')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={t('menu.products')} width={140} />
        <Table.Column dataIndex="name" title={t('menu.products')} />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column dataIndex="uom" title={t('menu.products')} width={80} />
        <Table.Column dataIndex="description" title={t('menu.products')} ellipsis />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('products', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('products', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
