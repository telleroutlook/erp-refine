import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const SerialNumberList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'serial-numbers',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title="序列号"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('serial-numbers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="serial_number" title="序列号" width={180} />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="status" title={t('common.status')} width={120} render={(s) => <StatusTag status={s} />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('serial-numbers', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('serial-numbers', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
