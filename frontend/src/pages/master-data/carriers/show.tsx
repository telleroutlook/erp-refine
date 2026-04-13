import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';

export const CarrierShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'carriers' });
  const record = queryResult?.data?.data as any;

  const carrierTypeLabels: Record<string, string> = {
    express: '快递', freight: '货运', ltl: 'LTL', ftl: 'FTL', ocean: '海运', air: '空运',
  };

  return (
    <Show title="承运商详情">
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="类型">{carrierTypeLabels[record?.carrier_type] ?? record?.carrier_type}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={record?.is_active ? 'green' : 'red'}>{record?.is_active ? '启用' : '停用'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="联系人">{record?.contact}</Descriptions.Item>
        <Descriptions.Item label="电话">{record?.phone}</Descriptions.Item>
        <Descriptions.Item label="追踪URL模板" span={2}>{record?.tracking_url_template || '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
