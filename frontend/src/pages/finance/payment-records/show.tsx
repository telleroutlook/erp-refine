import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { useFieldLabel } from '../../../hooks';

export const PaymentRecordShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'payment-records' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.paymentRecords')} ${record?.payment_number ?? ''}`} isLoading={queryResult.isLoading}>
      <DocumentFlowPanel objectType="payment_record" objectId={record?.id} />
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('payment_records', 'payment_number')}>{record?.payment_number}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'payment_date')}>
          <DateField value={record?.payment_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'payment_type')}>{record?.payment_type}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'payment_method')}>{record?.payment_method}</Descriptions.Item>
        <Descriptions.Item label={t('common.amount')}>
          <AmountDisplay value={record?.amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'partner_type')}>{record?.partner_type}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'partner_id')}>{record?.partner_id}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'reference_type')}>{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label={fl('payment_records', 'reference_id')}>{record?.reference_id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
