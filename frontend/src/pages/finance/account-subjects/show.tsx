import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AccountSubjectShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'account-subjects' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`会计科目 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="科目编码">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="科目名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="类别">{record?.category}</Descriptions.Item>
        <Descriptions.Item label="余额方向">
          {record?.balance_direction === 'debit' ? '借' : '贷'}
        </Descriptions.Item>
        <Descriptions.Item label="上级科目">{record?.parent_id}</Descriptions.Item>
        <Descriptions.Item label="末级科目">
          <Tag color={record?.is_leaf ? 'green' : 'default'}>{record?.is_leaf ? '是' : '否'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
