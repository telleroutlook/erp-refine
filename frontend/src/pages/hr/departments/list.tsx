import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const DepartmentList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'departments',
    sorters: {
      initial: [{ field: 'code', order: 'asc' }],
    },
  });

  return (
    <List
      title="部门"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('departments')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="编号" width={120} />
        <Table.Column dataIndex="name" title="名称" />
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
