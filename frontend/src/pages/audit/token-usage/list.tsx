import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const TokenUsageList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'token-usage',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.tokenUsage')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="session_id" title={t('menu.tokenUsage')} width={280} ellipsis />
        <Table.Column dataIndex="model" title={t('menu.tokenUsage')} width={140} />
        <Table.Column dataIndex="input_tokens" title={t('menu.tokenUsage')} width={100} align="right" />
        <Table.Column dataIndex="output_tokens" title={t('menu.tokenUsage')} width={100} align="right" />
        <Table.Column dataIndex="total_tokens" title={t('menu.tokenUsage')} width={100} align="right" />
        <Table.Column dataIndex="cost_estimate" title={t('menu.tokenUsage')} width={100} align="right" render={(v) => v != null ? `$${Number(v).toFixed(4)}` : '—'} />
        <Table.Column dataIndex="created_at" title={t('menu.tokenUsage')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('token-usage', r.id)} />} />
      </Table>
    </List>
  );
};
