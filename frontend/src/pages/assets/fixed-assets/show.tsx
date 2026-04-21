import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const FixedAssetShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'fixed-assets' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`固定资产 ${record?.asset_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="资产编号">{record?.asset_number}</Descriptions.Item>
        <Descriptions.Item label="资产名称">{record?.asset_name}</Descriptions.Item>
        <Descriptions.Item label="分类">{record?.category}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="购入日期">
          <DateField value={record?.acquisition_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="购入成本">
          <AmountDisplay value={record?.acquisition_cost} />
        </Descriptions.Item>
        <Descriptions.Item label="折旧方法">{record?.depreciation_method}</Descriptions.Item>
        <Descriptions.Item label="使用寿命（月）">{record?.useful_life_months}</Descriptions.Item>
        <Descriptions.Item label="残值">
          <AmountDisplay value={record?.salvage_value} />
        </Descriptions.Item>
        <Descriptions.Item label="账面净值">
          <AmountDisplay value={record?.current_book_value} />
        </Descriptions.Item>
        <Descriptions.Item label="部门">{record?.department}</Descriptions.Item>
        <Descriptions.Item label="位置">{record?.location}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
