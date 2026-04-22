import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'magenta' };

export const BusinessEventList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'business-events',
    sorters: { initial: [{ field: 'occurred_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.businessEvents')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="event_type" title="事件类型" width={160} />
        <Table.Column dataIndex="entity_type" title="实体类型" width={140} />
        <Table.Column dataIndex="entity_id" title="实体ID" width={280} ellipsis />
        <Table.Column dataIndex="severity" title="级别" width={80} render={(v) => <Tag color={SEVERITY_COLORS[v] ?? 'default'}>{v}</Tag>} />
        <Table.Column dataIndex="source_system" title="来源" width={120} />
        <Table.Column dataIndex="processed" title="已处理" width={80} render={(v) => v ? <Tag color="success">是</Tag> : <Tag>否</Tag>} />
        <Table.Column dataIndex="occurred_at" title="发生时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('business-events', r.id)} />} />
      </Table>
    </List>
  );
};
