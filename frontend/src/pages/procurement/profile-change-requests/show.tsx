import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ProfileChangeRequestShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'profile-change-requests' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`变更申请 ${record?.change_request_id ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="变更申请编号">{record?.change_request_id}</Descriptions.Item>
        <Descriptions.Item label="申请类型">{record?.request_type}</Descriptions.Item>
        <Descriptions.Item label="供应商ID">{record?.supplier_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          {record?.status && <StatusTag status={record.status} />}
        </Descriptions.Item>
        <Descriptions.Item label="创建人">{record?.created_by}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="变更前数据" span={2}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {record?.before_data ? JSON.stringify(record.before_data, null, 2) : '-'}
          </pre>
        </Descriptions.Item>
        <Descriptions.Item label="变更后数据" span={2}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {record?.after_data ? JSON.stringify(record.after_data, null, 2) : '-'}
          </pre>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
