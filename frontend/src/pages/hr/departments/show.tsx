import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const DepartmentShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'departments' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`部门 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="上级部门">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="负责人">{record?.manager_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
