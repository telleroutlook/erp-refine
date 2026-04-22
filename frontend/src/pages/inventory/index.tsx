import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../hooks';

export const StockRecordList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();

  const { tableProps } = useTable({
    resource: 'stock-records',
    sorters: { initial: [{ field: 'updated_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.stockRecords')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex={['warehouse', 'name']} title={fl('warehouses', 'name')} />
        <Table.Column dataIndex={['product', 'code']} title={fl('products', 'code')} width={120} />
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex="quantity" title={fl('stock_records', 'quantity')} width={100} align="right" />
        <Table.Column dataIndex="reserved_quantity" title={fl('stock_records', 'reserved_quantity')} width={100} align="right" />
        <Table.Column
          dataIndex="available_quantity"
          title={fl('stock_records', 'available_quantity')}
          width={100}
          align="right"
        />
      </Table>
    </List>
  );
};
