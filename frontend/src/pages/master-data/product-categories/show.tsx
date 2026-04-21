import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const ProductCategoryShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'product-categories' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`产品分类 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="上级分类">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="层级">{record?.level}</Descriptions.Item>
        <Descriptions.Item label="启用">
          <Tag color={record?.is_active ? 'green' : 'default'}>{record?.is_active ? '是' : '否'}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
