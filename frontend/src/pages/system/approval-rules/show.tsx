import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const ApprovalRuleShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'approval-rules' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.approvalRules')} ${record?.rule_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('approval_rules', 'rule_name')}>{record?.rule_name}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'document_type')}>{record?.document_type}</Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'min_amount')}>
          {record?.min_amount != null ? Number(record.min_amount).toLocaleString() : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'max_amount')}>
          {record?.max_amount != null ? Number(record.max_amount).toLocaleString() : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'required_roles')} span={2}>
          {record?.required_roles?.length
            ? record.required_roles.map((role: string) => <Tag key={role}>{role}</Tag>)
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'sequence_order')}>{record?.sequence_order}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('approval_rules', 'created_at')}>{record?.created_at}</Descriptions.Item>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
