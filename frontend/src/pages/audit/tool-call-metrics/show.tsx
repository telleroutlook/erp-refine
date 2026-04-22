import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ToolCallMetricShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'tool-call-metrics' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.toolCallMetrics')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('tool_call_metrics', 'tool_name')}>{record?.tool_name}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_call_metrics', 'success')}>{record?.success ? <Tag color="success">{t('enums.successFail.success')}</Tag> : <Tag color="error">{t('enums.successFail.fail')}</Tag>}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_call_metrics', 'cache_hit')}>{record?.cache_hit ? <Tag color="blue">{t('enums.cacheHit.hit')}</Tag> : <Tag>{t('enums.cacheHit.miss')}</Tag>}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_call_metrics', 'duration_ms')}>{record?.duration_ms}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_call_metrics', 'session_id')}>{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_call_metrics', 'input_hash')}>{record?.input_hash}</Descriptions.Item>
        {record?.error_message && <Descriptions.Item label={fl('tool_call_metrics', 'error_message')} span={2}>{record.error_message}</Descriptions.Item>}
        <Descriptions.Item label={fl('tool_call_metrics', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
