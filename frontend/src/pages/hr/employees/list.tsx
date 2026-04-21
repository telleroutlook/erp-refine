import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const EmployeeList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'employees',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="员工"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('employees')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="employee_number" title="工号" width={120} />
        <Table.Column dataIndex="name" title="姓名" />
        <Table.Column dataIndex={['department', 'name']} title="部门" />
        <Table.Column dataIndex="position" title="职位" />
        <Table.Column dataIndex="email" title="邮箱" />
        <Table.Column dataIndex="phone" title="电话" />
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
