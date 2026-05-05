import React from 'react';
import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const ProductUomConversionShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'product-uom-conversions' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;

  return (
    <Show title={pt('product_uom_conversions', 'show')}>
      <Descriptions bordered column={2}>
        <Descriptions.Item label={fl('product_uom_conversions', 'product_id')}>{record?.product_id ?? t('common.general')}</Descriptions.Item>
        <Descriptions.Item label={fl('product_uom_conversions', 'from_uom_id')}>{record?.from_uom_id}</Descriptions.Item>
        <Descriptions.Item label={fl('product_uom_conversions', 'to_uom_id')}>{record?.to_uom_id}</Descriptions.Item>
        <Descriptions.Item label={fl('product_uom_conversions', 'conversion_factor')}>{record?.conversion_factor}</Descriptions.Item>
        <Descriptions.Item label={fl('product_uom_conversions', 'is_active')}>
          <Tag color={record?.is_active ? 'green' : 'default'}>{record?.is_active ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
