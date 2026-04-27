import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const ThreeWayMatchShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'three-way-match' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.threeWayMatch')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('three_way_match', 'match_status')}>{record?.match_status && <StatusTag status={record.match_status} />}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_orders', 'order_number')}>{record?.purchase_order?.order_number ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_receipts', 'receipt_number')}>{record?.purchase_receipt?.receipt_number ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('supplier_invoices', 'invoice_number')}>{record?.supplier_invoice?.invoice_number ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'quantity_variance')}>{record?.quantity_variance}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'price_variance')}>{record?.price_variance}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'amount_variance')}>{record?.amount_variance}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'matched_at')}>{record?.matched_at ? <DateField value={record.matched_at} format="YYYY-MM-DD HH:mm:ss" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'matched_by')}>{record?.matched_by_employee?.first_name ? `${record.matched_by_employee.first_name} ${record.matched_by_employee.last_name ?? ''}`.trim() : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'notes')} span={2}>{record?.notes ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('three_way_match', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
