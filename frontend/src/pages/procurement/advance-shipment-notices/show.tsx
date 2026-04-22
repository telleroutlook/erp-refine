import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const AdvanceShipmentNoticeShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'advance-shipment-notices' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('advance_shipment_notices', 'show')} ${record?.asn_no ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('advance_shipment_notices', 'asn_no')}>{record?.asn_no}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('advance_shipment_notices', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('advance_shipment_notices', 'warehouse_id')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('advance_shipment_notices', 'po_id')}>{record?.purchase_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label={fl('advance_shipment_notices', 'expected_date')}>
          <DateField value={record?.expected_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.remark && <Descriptions.Item label={t('common.notes')} span={2}>{record.remark}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>{t('sections.asnLines')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: 'line_number', title: fl('asn_lines', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('asn_lines', 'product_id') },
              { dataIndex: 'quantity', title: fl('asn_lines', 'quantity'), width: 100, align: 'right' as const },
              { dataIndex: 'lot_no', title: fl('asn_lines', 'lot_no'), width: 140 },
            ]}
          />
        </>
      )}
    </Show>
  );
};
