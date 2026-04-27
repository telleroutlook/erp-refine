import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { MATCH_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const ThreeWayMatchList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'three-way-match',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'status', field: 'match_status', label: t('filters.status'), options: translateOptions(MATCH_STATUS_OPTIONS, t) },
  ];

  return (
    <List title={t('menu.threeWayMatch')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="match_status" title={fl('three_way_match', 'match_status')} width={120} render={(v) => <StatusTag status={v} />} />
        <Table.Column dataIndex={['purchase_order', 'order_number']} title={fl('purchase_orders', 'order_number')} width={160} />
        <Table.Column dataIndex={['purchase_receipt', 'receipt_number']} title={fl('purchase_receipts', 'receipt_number')} width={160} />
        <Table.Column dataIndex={['supplier_invoice', 'invoice_number']} title={fl('supplier_invoices', 'invoice_number')} width={160} />
        <Table.Column dataIndex="quantity_variance" title={fl('three_way_match', 'quantity_variance')} width={120} align="right" />
        <Table.Column dataIndex="price_variance" title={fl('three_way_match', 'price_variance')} width={120} align="right" />
        <Table.Column dataIndex="amount_variance" title={fl('three_way_match', 'amount_variance')} width={120} align="right" />
        <Table.Column dataIndex="matched_at" title={fl('three_way_match', 'matched_at')} width={160} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('three-way-match', r.id)} />} />
      </Table>
    </List>
  );
};
