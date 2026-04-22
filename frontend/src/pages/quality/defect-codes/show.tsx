import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const DefectCodeShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'defect-codes' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`缺陷代码 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="代码">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="分类">{record?.category}</Descriptions.Item>
        <Descriptions.Item label="严重程度">{record?.severity}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
