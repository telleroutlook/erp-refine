import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const ExchangeRateShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'exchange-rates' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="汇率详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="源币种">{record?.from_currency}</Descriptions.Item>
        <Descriptions.Item label="目标币种">{record?.to_currency}</Descriptions.Item>
        <Descriptions.Item label="汇率">{record?.rate}</Descriptions.Item>
        <Descriptions.Item label="类型">{record?.rate_type}</Descriptions.Item>
        <Descriptions.Item label="生效日期">
          <DateField value={record?.effective_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="到期日期">
          {record?.expiry_date ? <DateField value={record.expiry_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
