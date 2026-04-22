import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const ExchangeRateList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'exchange-rates',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'from_currency', label: t('filters.fromCurrency') },
    { type: 'dateRange', field: 'effective_date', label: t('filters.effectiveDate') },
  ];

  return (
    <List
      title="汇率"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('exchange-rates')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="from_currency" title="源币种" />
        <Table.Column dataIndex="to_currency" title="目标币种" />
        <Table.Column dataIndex="rate" title="汇率" />
        <Table.Column dataIndex="rate_type" title="类型" />
        <Table.Column
          dataIndex="effective_date"
          title="生效日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="expiry_date"
          title="到期日期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('exchange-rates', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('exchange-rates', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
