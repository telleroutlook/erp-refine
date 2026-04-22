import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const AssetMaintenanceShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'asset-maintenance' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="资产维保详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="资产">{record?.asset?.asset_name}</Descriptions.Item>
        <Descriptions.Item label="维保类型">{record?.maintenance_type}</Descriptions.Item>
        <Descriptions.Item label="执行日期">
          <DateField value={record?.performed_at} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="执行人">{record?.performed_by}</Descriptions.Item>
        <Descriptions.Item label="费用">
          <AmountDisplay value={record?.cost} />
        </Descriptions.Item>
        <Descriptions.Item label="描述">{record?.description}</Descriptions.Item>
        <Descriptions.Item label="下次到期">
          {record?.next_due_at ? <DateField value={record.next_due_at} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
