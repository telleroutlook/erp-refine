import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const CustomerReceiptShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'customer-receipts' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`客户收款 ${record?.receipt_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="收款单号">{record?.receipt_number}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="客户">{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label="收款日期">
          <DateField value={record?.receipt_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="金额">
          <AmountDisplay value={record?.amount} />
        </Descriptions.Item>
        <Descriptions.Item label="收款方式">{record?.payment_method}</Descriptions.Item>
        <Descriptions.Item label="关联类型">{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label="关联单号">{record?.reference_id}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label="备注" span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
