import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { RECONCILIATION_STATUS_OPTIONS } from '../../../constants/options';

export const ReconciliationStatementList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'reconciliation-statements',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'statement_no', label: t('filters.search'), placeholder: 'RS-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: RECONCILIATION_STATUS_OPTIONS },
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
  ];

  return (
    <List
      title={t('menu.reconciliationStatements')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('reconciliation-statements')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="statement_no" title="对账单号" width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title="供应商" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="total_amount" title="总金额" width={140} align="right" render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />} />
        <Table.Column dataIndex="paid_amount" title="已付金额" width={140} align="right" render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />} />
        <Table.Column dataIndex="period_start" title="期间开始" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="period_end" title="期间结束" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('reconciliation-statements', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('reconciliation-statements', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
