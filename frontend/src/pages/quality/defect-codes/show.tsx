import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const DefectCodeShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'defect-codes' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`缺陷代码 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="代码">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="分类">{record?.category}</Descriptions.Item>
        <Descriptions.Item label="严重程度">{record?.severity}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={record?.is_active ? 'green' : 'default'}>
            {record?.is_active ? '启用' : '停用'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
