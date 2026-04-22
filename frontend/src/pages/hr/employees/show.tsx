import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const EmployeeShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'employees' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.employees')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('employees', 'employee_number')}>{record?.employee_number}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'department')}>{record?.department?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'position')}>{record?.position}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'email')}>{record?.email}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'phone')}>{record?.phone}</Descriptions.Item>
        <Descriptions.Item label={fl('employees', 'hire_date')}>
          {record?.hire_date ? <DateField value={record.hire_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
