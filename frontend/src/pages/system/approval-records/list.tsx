import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { APPROVAL_RECORD_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const ApprovalRecordList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'approval-records',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'document_type', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(APPROVAL_RECORD_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.approvalRecords')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="document_type" title={t('menu.approvalRecords')} width={140} />
        <Table.Column dataIndex="document_id" title={t('menu.approvalRecords')} width={200} ellipsis />
        <Table.Column dataIndex="decision_level" title={t('menu.approvalRecords')} width={100} align="center" />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column dataIndex="decision_by" title={t('menu.approvalRecords')} width={200} ellipsis />
        <Table.Column
          dataIndex="decision_at"
          title={t('menu.approvalRecords')}
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          dataIndex="created_at"
          title={t('menu.approvalRecords')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('approval-records', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
