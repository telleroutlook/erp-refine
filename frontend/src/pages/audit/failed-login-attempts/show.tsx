import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const FailedLoginAttemptShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'failed-login-attempts' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.failedLoginAttempts')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('failed_login_attempts', 'username')}>{record?.username}</Descriptions.Item>
        <Descriptions.Item label={fl('failed_login_attempts', 'ip_address')}>{record?.ip_address}</Descriptions.Item>
        <Descriptions.Item label={fl('failed_login_attempts', 'reason')} span={2}>{record?.reason}</Descriptions.Item>
        <Descriptions.Item label={fl('failed_login_attempts', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
