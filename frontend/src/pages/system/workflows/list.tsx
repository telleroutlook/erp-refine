import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { WORKFLOW_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const WorkflowList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'workflows',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'workflow_type', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(WORKFLOW_STATUS_OPTIONS, t) },
  ];

  return (
    <List title={t('menu.workflows')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="workflow_type" title={fl('workflows', 'workflow_type')} width={140} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="entity_type" title={fl('workflows', 'entity_type')} width={120} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column dataIndex="entity_id" title={fl('workflows', 'entity_id')} width={200} ellipsis />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column dataIndex="current_step" title={fl('workflows', 'current_step')} width={120} />
        <Table.Column
          dataIndex="started_at"
          title={fl('workflows', 'started_at')}
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          dataIndex="completed_at"
          title={fl('workflows', 'completed_at')}
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('workflows', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
