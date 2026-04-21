import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const WorkOrderProductionList: React.FC = () => {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { tableProps } = useTable({
    resource: 'work-order-productions',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title="生产报工"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('work-order-productions')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex={['work_order', 'work_order_number']} title="工单号" width={160} />
        <Table.Column dataIndex="production_date" title="报工日期" width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="quantity" title="生产数量" width={100} align="right" />
        <Table.Column dataIndex="qualified_quantity" title="合格数量" width={100} align="right" />
        <Table.Column dataIndex="defective_quantity" title="不良数量" width={100} align="right" />
        <Table.Column dataIndex="notes" title="备注" ellipsis />
        <Table.Column title={t('common.actions')} width={80} render={(_, record: any) => (
          <Button size="small" icon={<EyeOutlined />} onClick={() => show('work-order-productions', record.id)} />
        )} />
      </Table>
    </List>
  );
};
