import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const CostCenterShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'cost-centers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`成本中心 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="编码">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="上级中心">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="负责人">{record?.manager_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <Tag color={record?.is_active ? 'green' : 'default'}>{record?.is_active ? '启用' : '停用'}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
