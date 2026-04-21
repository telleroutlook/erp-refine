import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const SalesShipmentList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit } = useNavigation();

  const { tableProps } = useTable({
    resource: 'sales-shipments',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.salesShipments')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="shipment_number" title="发货单号" width={160} />
        <Table.Column dataIndex={['sales_order', 'order_number']} title="销售订单号" width={160} />
        <Table.Column dataIndex={['customer', 'name']} title="客户" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="shipment_date" title="发货日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-shipments', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('sales-shipments', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
