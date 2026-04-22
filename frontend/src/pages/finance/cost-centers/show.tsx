import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const CostCenterShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'cost-centers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`成本中心 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="编码">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="上级中心">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="负责人">{record?.manager_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
