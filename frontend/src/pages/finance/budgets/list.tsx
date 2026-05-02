import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BUDGET_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const BudgetList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'budgets',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'budget_name', label: fl('budgets', 'budget_name'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(BUDGET_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: fl('budgets', 'created_at') },
  ];

  return (
    <List
      title={t('menu.budgets')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('budgets')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="budget_name" title={fl('budgets', 'budget_name')} />
        <Table.Column dataIndex="budget_type" title={fl('budgets', 'budget_type')} render={(v) => v ? t(`enums.budgetType.${v}`, v) : '-'} />
        <Table.Column dataIndex="budget_year" title={fl('budgets', 'budget_year')} width={100} />
        <Table.Column dataIndex="currency" title={fl('budgets', 'currency')} width={80} />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, record: any) => <AmountDisplay value={v} currency={record.currency} />}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('budgets', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('budgets', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
