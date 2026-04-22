import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ProductShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'products' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.products')} ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('products', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('products', 'unit')}>{record?.uom}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'cost_price')}><AmountDisplay value={record?.cost_price} /></Descriptions.Item>
        <Descriptions.Item label={fl('products', 'sale_price')}><AmountDisplay value={record?.sale_price} /></Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label={fl('products', 'description')} span={2}>{record.description}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
