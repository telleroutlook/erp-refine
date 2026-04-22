import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const TokenUsageList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'token-usage',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.tokenUsage')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="session_id" title="会话ID" width={280} ellipsis />
        <Table.Column dataIndex="model" title="模型" width={140} />
        <Table.Column dataIndex="input_tokens" title="输入Token" width={100} align="right" />
        <Table.Column dataIndex="output_tokens" title="输出Token" width={100} align="right" />
        <Table.Column dataIndex="total_tokens" title="总Token" width={100} align="right" />
        <Table.Column dataIndex="cost_estimate" title="费用估算" width={100} align="right" render={(v) => v != null ? `$${Number(v).toFixed(4)}` : '—'} />
        <Table.Column dataIndex="created_at" title="时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('token-usage', r.id)} />} />
      </Table>
    </List>
  );
};
