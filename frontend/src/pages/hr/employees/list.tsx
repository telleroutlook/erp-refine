import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { EMPLOYEE_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const EmployeeList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'employees',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(EMPLOYEE_STATUS_OPTIONS, t) },
    { type: 'entity', field: 'department_id', label: t('filters.department'), resource: 'departments' },
  ];

  return (
    <List
      title={t('menu.employees')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('employees')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="employee_number" title={t('menu.employees')} width={120} />
        <Table.Column dataIndex="name" title={t('menu.employees')} />
        <Table.Column dataIndex={['department', 'name']} title={t('menu.employees')} />
        <Table.Column dataIndex="position" title={t('menu.employees')} />
        <Table.Column dataIndex="email" title={t('menu.employees')} />
        <Table.Column dataIndex="phone" title={t('menu.employees')} />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('employees', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('employees', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
