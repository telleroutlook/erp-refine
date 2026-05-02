import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

const SEVERITY_COLORS: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'magenta' };

export const BusinessEventList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'business-events',
    sorters: { initial: [{ field: 'occurred_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'event_type', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
    { type: 'dateRange', field: 'occurred_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.businessEvents')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="event_type" title={fl('business_events', 'event_type')} width={160} />
        <Table.Column dataIndex="entity_type" title={fl('business_events', 'entity_type')} width={140} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="entity_id" title={t('menu.businessEvents')} width={280} ellipsis />
        <Table.Column dataIndex="severity" title={fl('business_events', 'severity')} width={80} render={(v) => <Tag color={SEVERITY_COLORS[v] ?? 'default'}>{v ? String(t(`enums.eventSeverity.${v}`, v)) : '-'}</Tag>} />
        <Table.Column dataIndex="source_system" title={t('menu.businessEvents')} width={120} />
        <Table.Column dataIndex="processed" title={t('menu.businessEvents')} width={80} render={(v) => v ? <Tag color="success">{t('enums.yesNo.yes')}</Tag> : <Tag>{t('enums.yesNo.no')}</Tag>} />
        <Table.Column dataIndex="occurred_at" title={t('menu.businessEvents')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('business-events', r.id)} />} />
      </Table>
    </List>
  );
};
