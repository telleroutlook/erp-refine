import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel } from '../../../hooks';

export const AssetDepreciationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'asset-depreciations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.assetDepreciations')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('asset_depreciations', 'asset_id')}>{record?.asset_id}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'period_year')}>{record?.period_year}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'period_month')}>{record?.period_month}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'depreciation_amount')}>
          <AmountDisplay value={record?.depreciation_amount} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('fixed_assets', 'accumulated_depreciation')}>
          <AmountDisplay value={record?.accumulated_depreciation} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'book_value_after')}>
          <AmountDisplay value={record?.book_value_after} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'posted')}>
          <Tag color={record?.posted ? 'green' : 'default'}>{record?.posted ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={fl('asset_depreciations', 'created_at')}>
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
