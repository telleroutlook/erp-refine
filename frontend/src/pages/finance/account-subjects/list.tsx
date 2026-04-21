import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AccountSubjectList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'account-subjects',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  return (
    <List
      title="会计科目"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('account-subjects')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="科目编码" width={120} />
        <Table.Column dataIndex="name" title="科目名称" />
        <Table.Column dataIndex="category" title="类别" />
        <Table.Column
          dataIndex="balance_direction"
          title="余额方向"
          render={(v) => (v === 'debit' ? '借' : '贷')}
        />
        <Table.Column
          dataIndex="is_leaf"
          title="末级科目"
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>}
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
