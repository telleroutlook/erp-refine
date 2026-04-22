import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const AssetMaintenanceList: React.FC = () => {
  const { t } = useTranslation();
  const { show, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'asset-maintenance',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'entity', field: 'asset_id', label: t('filters.asset'), resource: 'fixed-assets', optionLabel: 'asset_name' },
    { type: 'dateRange', field: 'performed_at', label: t('filters.maintenanceDate') },
  ];

  return (
    <List
      title="资产维保"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('asset-maintenance')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex={['asset', 'asset_name']}
          title="资产"
        />
        <Table.Column dataIndex="maintenance_type" title="维保类型" />
        <Table.Column
          dataIndex="performed_at"
          title="执行日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="cost"
          title="费用"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="next_due_at"
          title="下次到期"
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('asset-maintenance', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
