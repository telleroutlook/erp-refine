import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const ProductCategoryShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'product-categories' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.productCategories')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('product_categories', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('product_categories', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('product_categories', 'parent_id')}>{record?.parent?.name ?? record?.parent_id ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('product_categories', 'level')}>{record?.level}</Descriptions.Item>
        <Descriptions.Item label={fl('product_categories', 'is_active')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
