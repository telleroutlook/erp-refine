import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const AssetDepreciationShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'asset-depreciations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="折旧记录详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="资产ID">{record?.asset_id}</Descriptions.Item>
        <Descriptions.Item label="年度">{record?.period_year}</Descriptions.Item>
        <Descriptions.Item label="月份">{record?.period_month}</Descriptions.Item>
        <Descriptions.Item label="折旧金额">
          <AmountDisplay value={record?.depreciation_amount} />
        </Descriptions.Item>
        <Descriptions.Item label="累计折旧">
          <AmountDisplay value={record?.accumulated_depreciation} />
        </Descriptions.Item>
        <Descriptions.Item label="折旧后净值">
          <AmountDisplay value={record?.book_value_after} />
        </Descriptions.Item>
        <Descriptions.Item label="已过账">
          <Tag color={record?.posted ? 'green' : 'default'}>{record?.posted ? '是' : '否'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
