import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { SOFT_DELETE_FILTER } from '../../../utils/filters';

export const SupplierList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'suppliers',
    filters: SOFT_DELETE_FILTER,
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
  });

  return (
    <List
      title={t('menu.suppliers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('suppliers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="供应商编号" width={140} />
        <Table.Column dataIndex="name" title="供应商名称" />
        <Table.Column dataIndex="contact_name" title="联系人" width={120} />
        <Table.Column dataIndex="phone" title="电话" width={140} />
        <Table.Column dataIndex="email" title="邮箱" width={180} />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('suppliers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('suppliers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
