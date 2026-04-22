import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const AssetDepreciationList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
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
    <List title={t('menu.assetDepreciations')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex={['asset', 'asset_name']}
          title={fl('asset_depreciations', 'asset_id')}
          render={(v, record: any) => v ?? record.asset_id}
        />
        <Table.Column dataIndex="period_year" title={fl('asset_depreciations', 'period_year')} width={80} />
        <Table.Column dataIndex="period_month" title={fl('asset_depreciations', 'period_month')} width={80} />
        <Table.Column
          dataIndex="depreciation_amount"
          title={fl('asset_depreciations', 'depreciation_amount')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="accumulated_depreciation"
          title={fl('fixed_assets', 'accumulated_depreciation')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="book_value_after"
          title={fl('asset_depreciations', 'book_value_after')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="posted"
          title={fl('asset_depreciations', 'posted')}
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
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
