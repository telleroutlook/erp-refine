import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { PAYMENT_REQUEST_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const PaymentRequestList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'payment-requests',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'request_number', label: fl('payment_requests', 'request_number'), placeholder: t('filters.searchPlaceholder') },
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(PAYMENT_REQUEST_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'supplier_id', label: fl('payment_requests', 'supplier_id'), resource: 'suppliers' },
    { type: 'dateRange', field: 'created_at', label: t('common.date') },
  ];

  return (
    <List title={t('menu.paymentRequests')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="request_number" title={fl('payment_requests', 'request_number')} width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title={fl('payment_requests', 'supplier_id')} />
        <Table.Column dataIndex="currency" title={t('common.currency')} width={80} />
        <Table.Column
          dataIndex="amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />}
        />
        <Table.Column
          dataIndex="ok_to_pay"
          title={fl('payment_requests', 'ok_to_pay')}
          width={90}
          render={(v) => <Tag color={v ? 'green' : 'orange'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
        />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="created_at" title={t('common.date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('payment-requests', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('payment-requests', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
