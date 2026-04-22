import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const AssetMaintenanceList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
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
      title={t('menu.assetMaintenance')}
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
          title={fl('asset_maintenance_records', 'asset_id')}
        />
        <Table.Column dataIndex="maintenance_type" title={fl('asset_maintenance_records', 'maintenance_type')} />
        <Table.Column
          dataIndex="performed_at"
          title={fl('asset_maintenance_records', 'performed_at')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="cost"
          title={fl('asset_maintenance_records', 'cost')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="next_due_at"
          title={fl('asset_maintenance_records', 'next_due_at')}
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
