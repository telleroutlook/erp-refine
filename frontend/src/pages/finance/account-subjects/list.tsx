import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const AccountSubjectList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'account-subjects',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: fl('account_subjects', 'name'), placeholder: t('filters.searchPlaceholder') },
    { type: 'search', field: 'code', label: fl('account_subjects', 'code'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.accountSubjects')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('account-subjects')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('account_subjects', 'code')} width={120} />
        <Table.Column dataIndex="name" title={fl('account_subjects', 'name')} />
        <Table.Column dataIndex="category" title={fl('account_subjects', 'category')} render={(v) => v ? t(`enums.accountCategory.${v}`, v) : '-'} />
        <Table.Column
          dataIndex="balance_direction"
          title={fl('account_subjects', 'balance_direction')}
          render={(v) => (v === 'debit' ? t('enums.balanceDirection.debit') : t('enums.balanceDirection.credit'))}
        />
        <Table.Column
          dataIndex="is_leaf"
          title={fl('account_subjects', 'is_leaf')}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('account-subjects', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('account-subjects', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
