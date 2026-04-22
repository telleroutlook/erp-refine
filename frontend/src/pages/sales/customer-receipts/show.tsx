import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const CustomerReceiptShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'customer-receipts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('customer_receipts', 'show')} ${record?.receipt_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('customer_receipts', 'receipt_number')}>{record?.receipt_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('customer_receipts', 'customer_id')}>{record?.customer?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('customer_receipts', 'receipt_date')}>
          <DateField value={record?.receipt_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={t('common.amount')}>
          <AmountDisplay value={record?.amount} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('customer_receipts', 'payment_method')}>{record?.payment_method}</Descriptions.Item>
        <Descriptions.Item label={fl('customer_receipts', 'reference_type')}>{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label={fl('customer_receipts', 'reference_id')}>{record?.reference_id}</Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </Show>
  );
};
