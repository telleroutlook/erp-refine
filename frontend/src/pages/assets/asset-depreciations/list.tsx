import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const AssetDepreciationList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'asset-depreciations',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'entity', field: 'asset_id', label: t('filters.asset'), resource: 'fixed-assets', optionLabel: 'asset_name' },
  ];

  return (
    <List title="折旧记录">
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex={['asset', 'asset_name']}
          title="资产"
          render={(v, record: any) => v ?? record.asset_id}
        />
        <Table.Column dataIndex="period_year" title="年度" width={80} />
        <Table.Column dataIndex="period_month" title="月份" width={80} />
        <Table.Column
          dataIndex="depreciation_amount"
          title="折旧金额"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="accumulated_depreciation"
          title="累计折旧"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="book_value_after"
          title="折旧后净值"
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="posted"
          title="已过账"
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('asset-depreciations', record.id)} />
          )}
        />
      </Table>
    </List>
  );
};
