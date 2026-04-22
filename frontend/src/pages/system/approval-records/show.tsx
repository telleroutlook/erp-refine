import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ApprovalRecordShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'approval-records' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.approvalRecords')} ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('approval_records', 'document_type')}>{record?.document_type}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'document_id')}>{record?.document_id}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'decision_level')}>{record?.decision_level}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          {record?.status && <StatusTag status={record.status} />}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'decision_by')}>{record?.decision_by}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'decision_at')}>
          {record?.decision_at ? <DateField value={record.decision_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'rule_id')}>{record?.rule_id}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'created_at')}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_records', 'comments')} span={2}>{record?.comments ?? '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
