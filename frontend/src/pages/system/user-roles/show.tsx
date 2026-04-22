import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const UserRoleShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'user-roles' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="用户角色详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="用户ID">{record?.user_id}</Descriptions.Item>
        <Descriptions.Item label="角色">{record?.role?.name}</Descriptions.Item>
        <Descriptions.Item label="分配人">{record?.assigned_by}</Descriptions.Item>
        <Descriptions.Item label="分配时间"><DateField value={record?.assigned_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
