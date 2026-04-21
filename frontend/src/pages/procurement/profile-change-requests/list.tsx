import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ProfileChangeRequestList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'profile-change-requests',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="变更申请"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('profile-change-requests')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="change_request_id" title="变更申请编号" width={180} />
        <Table.Column dataIndex="request_type" title="申请类型" width={140} />
        <Table.Column dataIndex="supplier_id" title="供应商ID" width={200} ellipsis />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column dataIndex="created_by" title="创建人" width={200} ellipsis />
        <Table.Column
          dataIndex="created_at"
          title="创建时间"
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
