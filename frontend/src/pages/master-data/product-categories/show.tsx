import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const ProductCategoryShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'product-categories' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`产品分类 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="上级分类">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="层级">{record?.level}</Descriptions.Item>
        <Descriptions.Item label="启用">
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
