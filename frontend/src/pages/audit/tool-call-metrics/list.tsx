import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const ToolCallMetricList: React.FC = () => {
  const { t } = useTranslation();
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
        <Table.Column dataIndex="tool_name" title="工具名称" width={180} />
        <Table.Column dataIndex="success" title="成功" width={80} render={(v) => v ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>} />
        <Table.Column dataIndex="cache_hit" title="缓存" width={80} render={(v) => v ? <Tag color="blue">命中</Tag> : <Tag>未命中</Tag>} />
        <Table.Column dataIndex="duration_ms" title="耗时(ms)" width={100} align="right" />
        <Table.Column dataIndex="session_id" title="会话ID" ellipsis width={200} />
        <Table.Column dataIndex="created_at" title="时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('tool-call-metrics', r.id)} />} />
      </Table>
    </List>
  );
};
