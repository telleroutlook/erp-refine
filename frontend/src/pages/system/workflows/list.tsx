import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { WORKFLOW_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const WorkflowList: React.FC = () => {
  const { t } = useTranslation();
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
    <List title="工作流">
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="workflow_type" title="工作流类型" width={140} />
        <Table.Column dataIndex="entity_type" title="关联类型" width={120} />
        <Table.Column dataIndex="entity_id" title="关联ID" width={200} ellipsis />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column dataIndex="current_step" title="当前步骤" width={120} />
        <Table.Column
          dataIndex="started_at"
          title="开始时间"
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          dataIndex="completed_at"
          title="完成时间"
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
