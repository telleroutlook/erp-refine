import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const ApprovalRuleList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'approval-rules',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="审批规则"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('approval-rules')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="rule_name" title="规则名称" />
        <Table.Column dataIndex="document_type" title="单据类型" width={140} />
        <Table.Column
          dataIndex="min_amount"
          title="最低金额"
          width={120}
          align="right"
          render={(v) => (v != null ? Number(v).toLocaleString() : '-')}
        />
        <Table.Column
          dataIndex="max_amount"
          title="最高金额"
          width={120}
          align="right"
          render={(v) => (v != null ? Number(v).toLocaleString() : '-')}
        />
        <Table.Column
          dataIndex="required_roles"
          title="审批角色"
          render={(v: string[]) =>
            v?.length ? v.map((role) => <Tag key={role}>{role}</Tag>) : '-'
          }
        />
        <Table.Column dataIndex="sequence_order" title="顺序" width={80} align="center" />
        <Table.Column
          dataIndex="is_active"
          title="状态"
          width={100}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('approval-rules', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('approval-rules', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
