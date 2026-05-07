import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

const RISK_COLORS: Record<string, string> = {
  D0: 'green', D1: 'blue', D2: 'orange', D3: 'red', D4: 'purple', D5: 'magenta',
};

export const ToolRegistryList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'tool-registry',
    sorters: { initial: [{ field: 'tool_name', order: 'asc' }] },
  });

  return (
    <List title={t('menu.toolRegistry')}>
      <Table {...tableProps} rowKey="tool_name" size="small">
        <Table.Column dataIndex="tool_name" title={fl('tool_registry', 'tool_name')} width={220} />
        <Table.Column dataIndex="domain" title={fl('tool_registry', 'domain')} width={120} />
        <Table.Column dataIndex="risk_level" title={fl('tool_registry', 'risk_level')} width={80} render={(v) => <Tag color={RISK_COLORS[v] ?? 'default'}>{v}</Tag>} />
        <Table.Column dataIndex="active" title={fl('tool_registry', 'active')} width={80} render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>} />
        <Table.Column dataIndex="version" title={fl('tool_registry', 'version')} width={80} />
        <Table.Column dataIndex="description" title={fl('tool_registry', 'description')} ellipsis />
        <Table.Column dataIndex="created_at" title={fl('tool_registry', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('tool-registry', r.tool_name)} />} />
      </Table>
    </List>
  );
};
