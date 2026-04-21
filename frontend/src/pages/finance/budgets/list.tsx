import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const BudgetList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'budgets',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="预算管理"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('budgets')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="budget_name" title="预算名称" />
        <Table.Column dataIndex="budget_type" title="预算类型" />
        <Table.Column dataIndex="budget_year" title="年度" width={100} />
        <Table.Column dataIndex="currency" title="货币" width={80} />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, record: any) => <AmountDisplay value={v} currency={record.currency} />}
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('budgets', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('budgets', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
