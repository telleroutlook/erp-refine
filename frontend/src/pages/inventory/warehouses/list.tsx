import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { SOFT_DELETE_FILTER } from '../../../utils/filters';

export const WarehouseList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'warehouses',
    filters: SOFT_DELETE_FILTER,
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  return (
    <List
      title={t('menu.warehouses')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('warehouses')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="仓库编号" width={140} />
        <Table.Column dataIndex="name" title="仓库名称" />
        <Table.Column dataIndex="location" title="位置" />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status')}
          width={100}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('warehouses', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('warehouses', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
