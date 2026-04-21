import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ApprovalRecordList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'approval-records',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List title="审批记录">
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="document_type" title="单据类型" width={140} />
        <Table.Column dataIndex="document_id" title="单据ID" width={200} ellipsis />
        <Table.Column dataIndex="decision_level" title="审批层级" width={100} align="center" />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(v) => <StatusTag status={v} />}
        />
        <Table.Column dataIndex="decision_by" title="审批人" width={200} ellipsis />
        <Table.Column
          dataIndex="decision_at"
          title="审批时间"
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          dataIndex="created_at"
          title="创建时间"
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
