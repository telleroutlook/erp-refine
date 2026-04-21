import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const StorageLocationList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'storage-locations',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  return (
    <List
      title="库位"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('storage-locations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="编号" width={120} />
        <Table.Column dataIndex="name" title="名称" />
        <Table.Column dataIndex={['warehouse', 'name']} title="仓库" />
        <Table.Column dataIndex="zone" title="区域" />
        <Table.Column
          dataIndex="is_active"
          title="启用"
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('storage-locations', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('storage-locations', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
