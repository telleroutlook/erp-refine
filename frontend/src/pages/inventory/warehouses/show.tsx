import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const WarehouseShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'warehouses' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`仓库 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="仓库编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="仓库名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="位置">{record?.location}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
