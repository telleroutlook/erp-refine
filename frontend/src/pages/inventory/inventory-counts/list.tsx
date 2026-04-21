import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const InventoryCountList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'inventory-counts',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title="库存盘点"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('inventory-counts')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="count_number" title="盘点单号" width={160} />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="count_date" title="盘点日期" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('inventory-counts', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('inventory-counts', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
