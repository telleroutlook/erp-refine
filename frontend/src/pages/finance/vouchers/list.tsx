import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { VOUCHER_STATUS_OPTIONS, VOUCHER_TYPE_OPTIONS } from '../../../constants/options';

export const VoucherList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'vouchers',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'voucher_number', label: '凭证号', placeholder: '搜索凭证号' },
    { type: 'status', field: 'status', label: t('common.status'), options: VOUCHER_STATUS_OPTIONS },
    { type: 'select', field: 'voucher_type', label: '凭证类型', options: VOUCHER_TYPE_OPTIONS },
    { type: 'dateRange', field: 'voucher_date', label: '凭证日期' },
  ];

  return (
    <List
      title="会计凭证"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('vouchers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="voucher_number" title="凭证号" width={160} />
        <Table.Column
          dataIndex="voucher_date"
          title="凭证日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column dataIndex="voucher_type" title="凭证类型" />
        <Table.Column
          dataIndex="total_debit"
          title="借方合计"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} currency="CNY" />}
        />
        <Table.Column
          dataIndex="total_credit"
          title="贷方合计"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} currency="CNY" />}
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('vouchers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('vouchers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
