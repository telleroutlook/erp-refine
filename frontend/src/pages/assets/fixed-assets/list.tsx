import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const FixedAssetList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'fixed-assets',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title="固定资产"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('fixed-assets')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="asset_number" title="资产编号" width={140} />
        <Table.Column dataIndex="asset_name" title="资产名称" />
        <Table.Column dataIndex="category" title="分类" />
        <Table.Column
          dataIndex="acquisition_date"
          title="购入日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="acquisition_cost"
          title="购入成本"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="current_book_value"
          title="账面净值"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('fixed-assets', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('fixed-assets', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
