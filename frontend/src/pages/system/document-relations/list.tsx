import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const DocumentRelationList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'document-relations',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="单据关联"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('document-relations')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="from_object_type" title="来源类型" width={120} />
        <Table.Column dataIndex="from_object_id" title="来源ID" width={200} ellipsis />
        <Table.Column dataIndex="relation_type" title="关联类型" width={120} />
        <Table.Column dataIndex="to_object_type" title="目标类型" width={120} />
        <Table.Column dataIndex="to_object_id" title="目标ID" width={200} ellipsis />
        <Table.Column dataIndex="label" title="标签" />
        <Table.Column
          dataIndex="created_at"
          title="创建时间"
          width={160}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD HH:mm" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('document-relations', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('document-relations', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
