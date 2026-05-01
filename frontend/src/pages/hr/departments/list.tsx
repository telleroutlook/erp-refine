import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { DEPARTMENT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const DepartmentList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'departments',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(DEPARTMENT_STATUS_OPTIONS, t) },
  ];

  return (
    <List
      title={t('menu.departments')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('departments')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={fl('departments', 'code')} width={120} />
        <Table.Column dataIndex="name" title={fl('departments', 'name')} />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={100}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('departments', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('departments', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
