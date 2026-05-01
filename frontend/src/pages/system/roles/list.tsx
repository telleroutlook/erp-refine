import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const RoleList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'roles',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
  ];

  return (
    <List
      title={t('menu.roles')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('roles')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="name" title={fl('roles', 'name')} width={160} />
        <Table.Column dataIndex="description" title={fl('roles', 'description')} />
        <Table.Column dataIndex="is_system" title={fl('roles', 'is_system')} width={100} render={(v) => v ? <Tag color="blue">{t('enums.yesNo.yes')}</Tag> : <Tag>{t('enums.yesNo.no')}</Tag>} />
        <Table.Column dataIndex="created_at" title={fl('roles', 'created_at')} width={120} render={(v) => <DateField value={v} format="YYYY-MM-DD" />} />
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
