import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { SOFT_DELETE_FILTER } from '../../../utils/filters';

export const ProductList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'products',
    filters: SOFT_DELETE_FILTER,
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  return (
    <List
      title={t('menu.products')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('products')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title="产品编号" width={140} />
        <Table.Column dataIndex="name" title="产品名称" />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status')}
          width={100}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column dataIndex="uom" title="单位" width={80} />
        <Table.Column dataIndex="description" title="描述" ellipsis />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('products', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('products', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
