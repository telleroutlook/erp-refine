import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

const SEVERITY_COLORS: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'magenta' };

export const BusinessEventShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'business-events' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.businessEvents')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('business_events', 'event_type')}>{record?.event_type}</Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'entity_type')}>{record?.entity_type}</Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'entity_id')}>{record?.entity_id}</Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'severity')}><Tag color={SEVERITY_COLORS[record?.severity] ?? 'default'}>{record?.severity}</Tag></Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'source_system')}>{record?.source_system}</Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'processed')}>{record?.processed ? <Tag color="success">{t('enums.yesNo.yes')}</Tag> : <Tag>{t('enums.yesNo.no')}</Tag>}</Descriptions.Item>
        <Descriptions.Item label={fl('business_events', 'occurred_at')}><DateField value={record?.occurred_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        {record?.payload && <Descriptions.Item label={fl('business_events', 'payload')} span={2}><pre style={{ margin: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(record.payload, null, 2)}</pre></Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
