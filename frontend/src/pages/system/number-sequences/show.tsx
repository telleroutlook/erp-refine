import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const NumberSequenceShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'number-sequences' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`编号规则 ${record?.sequence_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="序列名称">{record?.sequence_name}</Descriptions.Item>
        <Descriptions.Item label="前缀">{record?.prefix}</Descriptions.Item>
        <Descriptions.Item label="当前值">{record?.current_value}</Descriptions.Item>
        <Descriptions.Item label="补零位数">{record?.padding}</Descriptions.Item>
        <Descriptions.Item label="步长">{record?.increment_by}</Descriptions.Item>
        <Descriptions.Item label="创建时间"><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
