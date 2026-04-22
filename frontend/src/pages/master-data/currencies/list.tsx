import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const CurrencyList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'currencies',
    sorters: {
      initial: [{ field: 'currency_code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'currency_code', label: t('filters.code') },
    { type: 'search', field: 'currency_name', label: t('filters.name') },
  ];

  return (
    <List title={t('menu.currencies')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="currency_code" title={t('menu.currencies')} width={100} />
        <Table.Column dataIndex="currency_name" title={t('menu.currencies')} />
        <Table.Column dataIndex="symbol" title={t('menu.currencies')} width={60} />
        <Table.Column dataIndex="decimal_places" title={t('menu.currencies')} width={80} />
        <Table.Column
          dataIndex="is_active"
          title={t('menu.currencies')}
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('currencies', record.id)} />
          )}
        />
      </Table>
    </List>
  );
};
