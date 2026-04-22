import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const StorageLocationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'storage-locations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.storageLocations')} ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('storage_locations', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('storage_locations', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('storage_locations', 'warehouse_id')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('storage_locations', 'zone')}>{record?.zone}</Descriptions.Item>
        <Descriptions.Item label={fl('storage_locations', 'is_active')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
