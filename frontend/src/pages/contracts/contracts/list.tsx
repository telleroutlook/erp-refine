import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS } from '../../../constants/options';

export const ContractList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'contracts',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'contract_number', label: t('filters.contractNumber'), placeholder: 'CON-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: CONTRACT_STATUS_OPTIONS },
    { type: 'select', field: 'contract_type', label: t('filters.contractType'), options: CONTRACT_TYPE_OPTIONS },
    { type: 'dateRange', field: 'start_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List
      title="合同"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('contracts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="contract_number" title="合同号" width={160} />
        <Table.Column dataIndex="contract_type" title="合同类型" />
        <Table.Column dataIndex="party_type" title="对方类型" />
        <Table.Column
          dataIndex="start_date"
          title="开始日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="end_date"
          title="结束日期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="total_amount"
          title="合同金额"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('contracts', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('contracts', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
