import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const PaymentRequestShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'payment-requests' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.paymentRequests')} ${record?.request_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('payment_requests', 'request_number')}>{record?.request_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('payment_requests', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_requests', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={t('common.amount')}>
          <AmountDisplay value={record?.amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('payment_requests', 'ok_to_pay')}>
          <Tag color={record?.ok_to_pay ? 'green' : 'orange'}>{record?.ok_to_pay ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={fl('payment_requests', 'created_at')}>
          <DateField value={record?.created_at} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
