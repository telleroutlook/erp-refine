import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useFieldLabel } from '../../../hooks';

export const AccountSubjectShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'account-subjects' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.accountSubjects')} ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('account_subjects', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('account_subjects', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('account_subjects', 'category')}>{record?.category}</Descriptions.Item>
        <Descriptions.Item label={fl('account_subjects', 'balance_direction')}>
          {record?.balance_direction === 'debit' ? t('enums.balanceDirection.debit') : t('enums.balanceDirection.credit')}
        </Descriptions.Item>
        <Descriptions.Item label={fl('account_subjects', 'parent_id')}>{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label={fl('account_subjects', 'is_leaf')}>
          <Tag color={record?.is_leaf ? 'green' : 'default'}>{record?.is_leaf ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
