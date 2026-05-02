import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const ProfileChangeRequestList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'profile-change-requests',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
    { type: 'search', field: 'status', label: t('filters.status'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.profileChangeRequests')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('profile-change-requests')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="change_request_id" title={fl('profile_change_requests', 'change_request_id')} width={180} />
        <Table.Column dataIndex="request_type" title={fl('profile_change_requests', 'request_type')} width={140} render={(v) => v ? t(`enums.requestType.${v}`, v) : '-'} />
        <Table.Column dataIndex="supplier_id" title={fl('profile_change_requests', 'supplier_id')} width={200} ellipsis />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column dataIndex="created_by" title={fl('profile_change_requests', 'created_by')} width={200} ellipsis />
        <Table.Column
          dataIndex="created_at"
          title={fl('profile_change_requests', 'created_at')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('profile-change-requests', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('profile-change-requests', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
