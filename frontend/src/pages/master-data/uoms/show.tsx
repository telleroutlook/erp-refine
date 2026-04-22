import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const UomShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'uoms' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`计量单位 ${record?.uom_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="编码">{record?.uom_code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.uom_name}</Descriptions.Item>
        <Descriptions.Item label="类型">{record?.uom_type}</Descriptions.Item>
        <Descriptions.Item label="基础单位">{record?.base_uom_id}</Descriptions.Item>
        <Descriptions.Item label="换算系数">{record?.conversion_factor}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
