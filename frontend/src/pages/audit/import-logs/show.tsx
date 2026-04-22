import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ImportLogShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'import-logs' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="导入日志详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="资源类型">{record?.resource_type}</Descriptions.Item>
        <Descriptions.Item label="文件名">{record?.file_name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="导入人">{record?.imported_by}</Descriptions.Item>
        <Descriptions.Item label="总行数">{record?.total_rows}</Descriptions.Item>
        <Descriptions.Item label="成功数">{record?.success_count}</Descriptions.Item>
        <Descriptions.Item label="失败数">{record?.error_count}</Descriptions.Item>
        <Descriptions.Item label="开始时间"><DateField value={record?.started_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label="完成时间">{record?.completed_at ? <DateField value={record.completed_at} format="YYYY-MM-DD HH:mm:ss" /> : '—'}</Descriptions.Item>
        {record?.errors && <Descriptions.Item label="错误详情" span={2}><pre style={{ margin: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(record.errors, null, 2)}</pre></Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
