import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PRICE_LIST_STATUS_OPTIONS, PRICE_TYPE_OPTIONS, translateOptions } from '../../../constants/options';

export const PriceListList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
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
    { type: 'status', field: 'price_type', label: fl('price_lists', 'price_type'), options: translateOptions(PRICE_TYPE_OPTIONS, t) },
  ];

  return (
    <List
      title={t('menu.priceLists')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('price-lists')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('price_lists', 'code')} width={120} />
        <Table.Column dataIndex="name" title={fl('price_lists', 'name')} />
        <Table.Column
          dataIndex="price_type"
          title={fl('price_lists', 'price_type')}
          width={100}
          render={(v) => <Tag color={v === 'sales' ? 'blue' : 'orange'}>{t(`enums.price_type.${v}`)}</Tag>}
        />
        <Table.Column dataIndex="currency" title={fl('price_lists', 'currency')} width={80} />
        <Table.Column dataIndex="priority" title={fl('price_lists', 'priority')} width={70} align="center" />
        <Table.Column
          dataIndex="effective_from"
          title={fl('price_lists', 'effective_from')}
          width={110}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="effective_to"
          title={fl('price_lists', 'effective_to')}
          width={110}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="partner_type"
          title={fl('price_lists', 'partner_type')}
          width={100}
          render={(v) => v ? t(`enums.partner_type.${v}`) : t('common.general')}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={90}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
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
