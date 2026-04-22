import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { ASN_STATUS_OPTIONS } from '../../../constants/options';

export const AdvanceShipmentNoticeList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'advance-shipment-notices',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'asn_no', label: t('filters.search'), placeholder: 'ASN-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: ASN_STATUS_OPTIONS },
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
        <Table.Column dataIndex="asn_no" title="ASN编号" width={160} />
        <Table.Column dataIndex={['supplier', 'name']} title="供应商" />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="expected_date" title="预计到货日" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="created_at" title="创建时间" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
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
