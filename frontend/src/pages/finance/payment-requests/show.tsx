import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';

export const PaymentRequestShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'payment-requests' });
  const { t } = useTranslation();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`付款申请 ${record?.request_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="申请单号">{record?.request_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label="货币">{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.amount')}>
          <AmountDisplay value={record?.amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label="可付款">
          <Tag color={record?.ok_to_pay ? 'green' : 'orange'}>{record?.ok_to_pay ? '是' : '否'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="创建日期">
          <DateField value={record?.created_at} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
