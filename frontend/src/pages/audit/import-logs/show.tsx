import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ImportLogShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'import-logs' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.importLogs')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('import_logs', 'resource_type')}>{record?.resource_type}</Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'file_name')}>{record?.file_name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'imported_by')}>{record?.imported_by}</Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'total_rows')}>{record?.total_rows}</Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'success_count')}>{record?.success_count}</Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'error_count')}>{record?.error_count}</Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'started_at')}><DateField value={record?.started_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label={fl('import_logs', 'completed_at')}>{record?.completed_at ? <DateField value={record.completed_at} format="YYYY-MM-DD HH:mm:ss" /> : '—'}</Descriptions.Item>
        {record?.errors && <Descriptions.Item label={fl('import_logs', 'errors')} span={2}><pre style={{ margin: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(record.errors, null, 2)}</pre></Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
