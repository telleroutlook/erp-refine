import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { SOFT_DELETE_FILTER } from '../../../utils/filters';

export const SalesReturnList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'sales-returns',
    filters: SOFT_DELETE_FILTER,
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List title={t('menu.salesReturns')}>
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="return_number" title="退货单号" width={160} />
        <Table.Column dataIndex={['customer', 'name']} title="客户" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="return_date" title="退货日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          dataIndex="total_amount"
          title={t('common.amount')}
          width={140}
          align="right"
          render={(v, r: any) => <AmountDisplay value={v} currency={r.currency} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, r: any) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('sales-returns', r.id)} />
          )}
        />
      </Table>
    </List>
  );
};
