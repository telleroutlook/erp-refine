import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const ToolCallMetricList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'tool-call-metrics',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.toolCallMetrics')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="tool_name" title={t('menu.toolCallMetrics')} width={180} />
        <Table.Column dataIndex="success" title={t('menu.toolCallMetrics')} width={80} render={(v) => v ? <Tag color="success">{t('enums.successFail.success')}</Tag> : <Tag color="error">{t('enums.successFail.fail')}</Tag>} />
        <Table.Column dataIndex="cache_hit" title={t('menu.toolCallMetrics')} width={80} render={(v) => v ? <Tag color="blue">{t('enums.cacheHit.hit')}</Tag> : <Tag>{t('enums.cacheHit.miss')}</Tag>} />
        <Table.Column dataIndex="duration_ms" title={t('menu.toolCallMetrics')} width={100} align="right" />
        <Table.Column dataIndex="session_id" title={t('menu.toolCallMetrics')} ellipsis width={200} />
        <Table.Column dataIndex="created_at" title={t('menu.toolCallMetrics')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('tool-call-metrics', r.id)} />} />
      </Table>
    </List>
  );
};
