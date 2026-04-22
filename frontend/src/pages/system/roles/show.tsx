import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const RoleShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'roles' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`角色 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="角色名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="系统角色">{record?.is_system ? <Tag color="blue">是</Tag> : <Tag>否</Tag>}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label="创建时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
        <Descriptions.Item label="更新时间"><DateField value={record?.updated_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
