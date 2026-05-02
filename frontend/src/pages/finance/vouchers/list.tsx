import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { VOUCHER_STATUS_OPTIONS, VOUCHER_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const VoucherList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'vouchers',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'voucher_number', label: fl('vouchers', 'voucher_number'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(VOUCHER_STATUS_OPTIONS, t) },
    { type: 'select', field: 'voucher_type', label: fl('vouchers', 'voucher_type'), options: translateOptions(VOUCHER_TYPE_OPTIONS, t, 'enums.voucherType') },
    { type: 'dateRange', field: 'voucher_date', label: fl('vouchers', 'voucher_date') },
  ];

  return (
    <List
      title={t('menu.vouchers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('vouchers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="voucher_number" title={fl('vouchers', 'voucher_number')} width={160} />
        <Table.Column
          dataIndex="voucher_date"
          title={fl('vouchers', 'voucher_date')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column dataIndex="voucher_type" title={fl('vouchers', 'voucher_type')} render={(v) => v ? t(`enums.voucherType.${v}`, v) : '-'} />
        <Table.Column
          dataIndex="total_debit"
          title={fl('vouchers', 'total_debit')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} currency="CNY" />}
        />
        <Table.Column
          dataIndex="total_credit"
          title={fl('vouchers', 'total_credit')}
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
