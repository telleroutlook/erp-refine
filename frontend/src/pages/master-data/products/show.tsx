import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';

export const ProductShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'products' });
  const { t } = useTranslation();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`产品 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="产品编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="产品名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="单位">{record?.uom}</Descriptions.Item>
        <Descriptions.Item label="采购价"><AmountDisplay value={record?.cost_price} /></Descriptions.Item>
        <Descriptions.Item label="销售价"><AmountDisplay value={record?.sale_price} /></Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label="描述" span={2}>{record.description}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
