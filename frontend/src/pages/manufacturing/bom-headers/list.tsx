import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const BomHeaderList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const { tableProps } = useTable({
    resource: 'bom-headers',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title="物料清单"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('bom-headers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="bom_number" title="BOM编号" width={160} />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column dataIndex="quantity" title="基准数量" width={100} align="right" />
        <Table.Column dataIndex="version" title="版本" width={80} />
        <Table.Column dataIndex="effective_date" title="生效日期" width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="is_active" title="状态" width={80} render={(v) => <Tag color={v ? 'success' : 'default'}>{v ? '启用' : '停用'}</Tag>} />
        <Table.Column title={t('common.actions')} width={120} render={(_, record: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('bom-headers', record.id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => edit('bom-headers', record.id)} />
          </Space>
        )} />
      </Table>
    </List>
  );
};
