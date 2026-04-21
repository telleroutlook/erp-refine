import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const QualityStandardList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'quality-standards',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="质量标准"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('quality-standards')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="standard_code" title="标准代码" width={160} />
        <Table.Column dataIndex="standard_name" title="标准名称" />
        <Table.Column
          dataIndex="is_active"
          title="状态"
          width={100}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '停用'}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('quality-standards', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('quality-standards', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
