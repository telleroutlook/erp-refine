import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';

export const StockRecordList: React.FC = () => {
  const { t } = useTranslation();

  const { tableProps } = useTable({
    resource: 'stock-records',
    sorters: { initial: [{ field: 'updated_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.stockRecords')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex={['product', 'code']} title="产品编号" width={120} />
        <Table.Column dataIndex={['product', 'name']} title="产品名称" />
        <Table.Column dataIndex="qty_on_hand" title="在手数量" width={100} align="right" />
        <Table.Column dataIndex="qty_reserved" title="预留数量" width={100} align="right" />
        <Table.Column
          dataIndex="qty_available"
          title="可用数量"
          width={100}
          align="right"
        />
      </Table>
    </List>
  );
};
