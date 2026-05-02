import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, translateOptions } from '../../../constants/options';

export const ContractList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'contracts',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'contract_number', label: t('filters.contractNumber'), placeholder: 'CON-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(CONTRACT_STATUS_OPTIONS, t) },
    { type: 'select', field: 'contract_type', label: t('filters.contractType'), options: translateOptions(CONTRACT_TYPE_OPTIONS, t, 'enums.contractType') },
    { type: 'dateRange', field: 'start_date', label: t('filters.dateRange') },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct'), placeholder: t('filters.itemProductPlaceholder') },
  ];

  return (
    <List
      title={t('menu.contracts')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('contracts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="contract_number" title={fl('contracts', 'contract_number')} width={160} />
        <Table.Column dataIndex="contract_type" title={fl('contracts', 'contract_type')} render={(v) => v ? t(`enums.contractType.${v}`, v) : '-'} />
        <Table.Column dataIndex="party_type" title={fl('contracts', 'party_type')} render={(v) => v ? t(`enums.partyType.${v}`, v) : '-'} />
        <Table.Column
          dataIndex="start_date"
          title={fl('contracts', 'start_date')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="end_date"
          title={fl('contracts', 'end_date')}
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="total_amount"
          title={fl('contracts', 'total_amount')}
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
