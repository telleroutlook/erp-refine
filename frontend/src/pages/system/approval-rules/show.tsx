import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const ApprovalRuleShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'approval-rules' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`审批规则 ${record?.rule_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="规则名称">{record?.rule_name}</Descriptions.Item>
        <Descriptions.Item label="单据类型">{record?.document_type}</Descriptions.Item>
        <Descriptions.Item label="最低金额">
          {record?.min_amount != null ? Number(record.min_amount).toLocaleString() : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="最高金额">
          {record?.max_amount != null ? Number(record.max_amount).toLocaleString() : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="审批角色" span={2}>
          {record?.required_roles?.length
            ? record.required_roles.map((role: string) => <Tag key={role}>{role}</Tag>)
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="顺序">{record?.sequence_order}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{record?.created_at}</Descriptions.Item>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
