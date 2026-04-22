import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProfileChangeRequestShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'profile-change-requests' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('profile_change_requests', 'show')} ${record?.change_request_id ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('profile_change_requests', 'change_request_id')}>{record?.change_request_id}</Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'request_type')}>{record?.request_type}</Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'supplier_id')}>{record?.supplier_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          {record?.status && <StatusTag status={record.status} />}
        </Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'created_by')}>{record?.created_by}</Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'created_at')}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'before_data')} span={2}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {record?.before_data ? JSON.stringify(record.before_data, null, 2) : '-'}
          </pre>
        </Descriptions.Item>
        <Descriptions.Item label={fl('profile_change_requests', 'after_data')} span={2}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {record?.after_data ? JSON.stringify(record.after_data, null, 2) : '-'}
          </pre>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
