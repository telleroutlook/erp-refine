import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { QUOTATION_STATUS_OPTIONS } from '../../../constants/options';

export const SupplierQuotationList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'supplier-quotations',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'quotation_number', label: t('filters.search'), placeholder: 'QUO-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: QUOTATION_STATUS_OPTIONS },
  ];

  return (
    <List
      title="供应商报价"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('supplier-quotations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="quotation_number" title="报价单号" width={160} />
        <Table.Column
          dataIndex={['supplier', 'name']}
          title="供应商"
        />
        <Table.Column dataIndex="currency" title={t('common.currency')} width={80} />
        <Table.Column
          dataIndex="validity_date"
          title="有效期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('supplier-quotations', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('supplier-quotations', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
