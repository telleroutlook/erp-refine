import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const DepartmentShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'departments' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.departments')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('departments', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('departments', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('departments', 'parent_id')}>{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label={fl('departments', 'manager_id')}>{record?.manager_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
