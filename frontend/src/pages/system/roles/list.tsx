import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const RoleList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'roles',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title={t('menu.roles')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('roles')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="name" title="角色名称" width={160} />
        <Table.Column dataIndex="description" title="描述" />
        <Table.Column dataIndex="is_system" title="系统角色" width={100} render={(v) => v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>} />
        <Table.Column dataIndex="created_at" title="创建时间" width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, r: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('roles', r.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('roles', r.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
