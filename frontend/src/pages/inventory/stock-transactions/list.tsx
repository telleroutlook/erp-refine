import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const StockTransactionList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'stock-transactions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title="库存流水">
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="transaction_date" title="日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="transaction_type" title="类型" width={120} />
        <Table.Column dataIndex="quantity" title="数量" width={100} align="right" />
        <Table.Column dataIndex="reference_type" title="关联类型" width={120} />
        <Table.Column dataIndex="reference_id" title="关联单号" width={140} />
        <Table.Column
          title={t('common.actions')}
          width={60}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('stock-transactions', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
