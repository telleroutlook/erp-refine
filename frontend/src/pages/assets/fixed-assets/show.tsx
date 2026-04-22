import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel } from '../../../hooks';

export const FixedAssetShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'fixed-assets' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.assets')} ${record?.asset_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('fixed_assets', 'asset_number')}>{record?.asset_number}</Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'asset_name')}>{record?.asset_name}</Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'category')}>{record?.category}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'acquisition_date')}>
          <DateField value={record?.acquisition_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'acquisition_cost')}>
          <AmountDisplay value={record?.acquisition_cost} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'depreciation_method')}>{record?.depreciation_method}</Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'useful_life_months')}>{record?.useful_life_months}</Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'salvage_value')}>
          <AmountDisplay value={record?.salvage_value} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'current_book_value')}>
          <AmountDisplay value={record?.current_book_value} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'department')}>{record?.department}</Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'location')}>{record?.location}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
