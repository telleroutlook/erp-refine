import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const WorkflowShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'workflows' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.workflows')} ${record?.workflow_type ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('workflows', 'workflow_type')}>{record?.workflow_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          {record?.status ? <StatusTag status={record.status} /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'relation_type')}>{record?.entity_type || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'entity_id')}>{record?.entity_id || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'current_step')}>{record?.current_step || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'started_by')}>{record?.started_by || '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'started_at')}>
          {record?.started_at ? <DateField value={record.started_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'completed_at')}>
          {record?.completed_at ? <DateField value={record.completed_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'created_at')} span={2}>
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('workflows', 'metadata')} span={2}>
          {record?.metadata ? <pre style={{ margin: 0 }}>{JSON.stringify(record.metadata, null, 2)}</pre> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
