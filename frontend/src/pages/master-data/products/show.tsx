import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ProductShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'products' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`产品 ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="产品编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="产品名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="单位">{record?.uom}</Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label="描述" span={2}>{record.description}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
