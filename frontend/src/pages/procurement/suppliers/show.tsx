import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';

export const SupplierShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'suppliers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`供应商 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="供应商编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="供应商名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="联系人">{record?.contact_person}</Descriptions.Item>
        <Descriptions.Item label="电话">{record?.contact_phone}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{record?.contact_email}</Descriptions.Item>
        {record?.address && (
          <Descriptions.Item label="地址" span={2}>{record.address}</Descriptions.Item>
        )}
        {record?.notes && (
          <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
