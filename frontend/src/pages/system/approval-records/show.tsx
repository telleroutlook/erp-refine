import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ApprovalRecordShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'approval-records' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`审批记录 ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="单据类型">{record?.document_type}</Descriptions.Item>
        <Descriptions.Item label="单据ID">{record?.document_id}</Descriptions.Item>
        <Descriptions.Item label="审批层级">{record?.decision_level}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          {record?.status && <StatusTag status={record.status} />}
        </Descriptions.Item>
        <Descriptions.Item label="审批人">{record?.decision_by}</Descriptions.Item>
        <Descriptions.Item label="审批时间">
          {record?.decision_at ? <DateField value={record.decision_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="规则ID">{record?.rule_id}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="审批意见" span={2}>{record?.comments ?? '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
