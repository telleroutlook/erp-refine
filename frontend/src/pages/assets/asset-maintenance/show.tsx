import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel } from '../../../hooks';

export const AssetMaintenanceShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'asset-maintenance' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.assetMaintenance')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('asset_maintenance_records', 'asset_id')}>{record?.asset?.asset_name}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'maintenance_type')}>{record?.maintenance_type}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'performed_at')}>
          <DateField value={record?.performed_at} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'performed_by')}>{record?.performed_by}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'cost')}>
          <AmountDisplay value={record?.cost} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'description')}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={fl('asset_maintenance_records', 'next_due_at')}>
          {record?.next_due_at ? <DateField value={record.next_due_at} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
