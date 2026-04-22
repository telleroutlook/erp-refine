import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const UomShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'uoms' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.uoms')} ${record?.uom_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('uoms', 'code')}>{record?.uom_code}</Descriptions.Item>
        <Descriptions.Item label={fl('uoms', 'name')}>{record?.uom_name}</Descriptions.Item>
        <Descriptions.Item label={fl('uoms', 'type')}>{record?.uom_type}</Descriptions.Item>
        <Descriptions.Item label={fl('uoms', 'base_uom_id')}>{record?.base_uom_id}</Descriptions.Item>
        <Descriptions.Item label={fl('uoms', 'conversion_factor')}>{record?.conversion_factor}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
