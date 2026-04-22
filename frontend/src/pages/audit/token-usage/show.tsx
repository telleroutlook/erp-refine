import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const TokenUsageShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'token-usage' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.tokenUsage')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('token_usage', 'session_id')}>{record?.session_id}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'model')}>{record?.model}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'variant')}>{record?.variant}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'input_tokens')}>{record?.input_tokens}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'output_tokens')}>{record?.output_tokens}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'total_tokens')}>{record?.total_tokens}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'cost_estimate')}>{record?.cost_estimate != null ? `$${Number(record.cost_estimate).toFixed(4)}` : '—'}</Descriptions.Item>
        <Descriptions.Item label={fl('token_usage', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
