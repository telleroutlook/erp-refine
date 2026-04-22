import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { ASN_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const AdvanceShipmentNoticeList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'advance-shipment-notices',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'asn_no', label: t('filters.search'), placeholder: 'ASN-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(ASN_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'supplier_id', label: t('filters.supplier'), resource: 'suppliers' },
    { type: 'dateRange', field: 'expected_date', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.advanceShipmentNotices')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('advance-shipment-notices')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="asn_no" title={fl('advance_shipment_notices', 'asn_no')} width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title={fl('advance_shipment_notices', 'supplier_id')} />
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('advance_shipment_notices', 'warehouse_id')} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="expected_date" title={fl('advance_shipment_notices', 'expected_date')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="created_at" title={fl('advance_shipment_notices', 'created_at')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('advance-shipment-notices', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('advance-shipment-notices', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
