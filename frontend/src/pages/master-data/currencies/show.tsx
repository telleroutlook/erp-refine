import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const CurrencyShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'currencies' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`币种 ${record?.currency_code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="币种代码">{record?.currency_code}</Descriptions.Item>
        <Descriptions.Item label="币种名称">{record?.currency_name}</Descriptions.Item>
        <Descriptions.Item label="符号">{record?.symbol}</Descriptions.Item>
        <Descriptions.Item label="小数位">{record?.decimal_places}</Descriptions.Item>
        <Descriptions.Item label="启用">
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
