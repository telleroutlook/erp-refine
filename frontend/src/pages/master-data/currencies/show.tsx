import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const CurrencyShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'currencies' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.currencies')} ${record?.currency_code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('currencies', 'currency_code')}>{record?.currency_code}</Descriptions.Item>
        <Descriptions.Item label={fl('currencies', 'currency_name')}>{record?.currency_name}</Descriptions.Item>
        <Descriptions.Item label={fl('currencies', 'symbol')}>{record?.symbol}</Descriptions.Item>
        <Descriptions.Item label={fl('currencies', 'decimal_places')}>{record?.decimal_places}</Descriptions.Item>
        <Descriptions.Item label={fl('currencies', 'is_active')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
