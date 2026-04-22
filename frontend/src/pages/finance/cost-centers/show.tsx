import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { useFieldLabel } from '../../../hooks';

export const CostCenterShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'cost-centers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.costCenters')} ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('cost_centers', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('cost_centers', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('cost_centers', 'parent_id')}>{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label={fl('cost_centers', 'manager_id')}>{record?.manager_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
