import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { ASSET_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const FixedAssetList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'fixed-assets',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'asset_number', label: t('filters.assetNumber'), placeholder: 'FA-...' },
    { type: 'search', field: 'asset_name', label: t('filters.name') },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(ASSET_STATUS_OPTIONS, t) },
  ];

  return (
    <List
      title={t('menu.assets')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('fixed-assets')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="asset_number" title={fl('fixed_assets', 'asset_number')} width={140} />
        <Table.Column dataIndex="asset_name" title={fl('fixed_assets', 'asset_name')} />
        <Table.Column dataIndex="category" title={fl('fixed_assets', 'category')} />
        <Table.Column
          dataIndex="acquisition_date"
          title={fl('fixed_assets', 'acquisition_date')}
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column
          dataIndex="acquisition_cost"
          title={fl('fixed_assets', 'acquisition_cost')}
          width={140}
          align="right"
          render={(v) => <AmountDisplay value={v} />}
        />
        <Table.Column
          dataIndex="current_book_value"
          title={fl('fixed_assets', 'current_book_value')}
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
