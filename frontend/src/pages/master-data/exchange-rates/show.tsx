import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ExchangeRateShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'exchange-rates' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.exchangeRates')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('exchange_rates', 'from_currency')}>{record?.from_currency}</Descriptions.Item>
        <Descriptions.Item label={fl('exchange_rates', 'to_currency')}>{record?.to_currency}</Descriptions.Item>
        <Descriptions.Item label={fl('exchange_rates', 'rate')}>{record?.rate}</Descriptions.Item>
        <Descriptions.Item label={fl('exchange_rates', 'type')}>{record?.rate_type}</Descriptions.Item>
        <Descriptions.Item label={fl('exchange_rates', 'effective_date')}>
          <DateField value={record?.effective_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('exchange_rates', 'expiry_date')}>
          {record?.expiry_date ? <DateField value={record.expiry_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
