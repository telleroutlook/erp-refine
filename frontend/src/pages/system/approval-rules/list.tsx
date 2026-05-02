import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const ApprovalRuleList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'approval-rules',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'rule_name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.approvalRules')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('approval-rules')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="rule_name" title={fl('approval_rules', 'rule_name')} />
        <Table.Column dataIndex="document_type" title={fl('approval_rules', 'document_type')} width={140} render={(v) => v ? t(`enums.documentType.${v}`, v) : '-'} />
        <Table.Column
          dataIndex="min_amount"
          title={fl('approval_rules', 'min_amount')}
          width={120}
          align="right"
          render={(v) => (v != null ? Number(v).toLocaleString() : '-')}
        />
        <Table.Column
          dataIndex="max_amount"
          title={fl('approval_rules', 'max_amount')}
          width={120}
          align="right"
          render={(v) => (v != null ? Number(v).toLocaleString() : '-')}
        />
        <Table.Column
          dataIndex="required_roles"
          title={fl('approval_rules', 'required_roles')}
          render={(v: string[]) =>
            v?.length ? v.map((role) => <Tag key={role}>{role}</Tag>) : '-'
          }
        />
        <Table.Column dataIndex="sequence_order" title={fl('approval_rules', 'sequence_order')} width={80} align="center" />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status')}
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
