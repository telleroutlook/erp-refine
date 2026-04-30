import React, { useState } from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { BulkActionBar } from '../../../components/shared/BulkActionBar';
import { REQUISITION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const PurchaseRequisitionList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create, push } = useNavigation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const { tableProps, setFilters } = useTable({
    resource: 'purchase-requisitions',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'requisition_number', label: t('filters.search'), placeholder: 'REQ-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(REQUISITION_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.purchaseRequisitions')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('purchase-requisitions')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <BulkActionBar
        selectedCount={selectedRowKeys.length}
        onClear={() => setSelectedRowKeys([])}
        actions={[
          {
            key: 'createPO',
            label: t('buttons.createPurchaseOrder'),
            icon: <ShoppingCartOutlined />,
            onClick: () => push(`/procurement/purchase-orders/create?createFrom=purchase-requisition&sourceId=${selectedRowKeys[0]}`),
          },
        ]}
      />
      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
      >
        <Table.Column dataIndex="requisition_number" title={fl('purchase_requisitions', 'requisition_number')} width={160} />
        <Table.Column
          dataIndex={['department', 'name']}
          title={fl('purchase_requisitions', 'department_id')}
        />
        <Table.Column
          dataIndex="request_date"
          title={fl('purchase_requisitions', 'request_date')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="required_date"
          title={fl('purchase_requisitions', 'required_date')}
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('purchase-requisitions', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('purchase-requisitions', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
