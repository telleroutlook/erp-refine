import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const EmployeeShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'employees' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`员工 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="工号">{record?.employee_number}</Descriptions.Item>
        <Descriptions.Item label="姓名">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="部门">{record?.department?.name}</Descriptions.Item>
        <Descriptions.Item label="职位">{record?.position}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{record?.email}</Descriptions.Item>
        <Descriptions.Item label="电话">{record?.phone}</Descriptions.Item>
        <Descriptions.Item label="入职日期">
          {record?.hire_date ? <DateField value={record.hire_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
