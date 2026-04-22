import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SupplierQuotationShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'supplier-quotations' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('supplier_quotations', 'show')} ${record?.quotation_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('supplier_quotations', 'quotation_number')}>{record?.quotation_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('supplier_quotations', 'supplier_id')}>{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('supplier_quotations', 'validity_date')}>
          {record?.validity_date ? <DateField value={record.validity_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.quotationLines')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('supplier_quotation_lines', 'product_id') },
              { dataIndex: 'qty_offered', title: fl('supplier_quotation_lines', 'qty_offered'), width: 100, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('supplier_quotation_lines', 'unit_price'), width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'total_price', title: fl('supplier_quotation_lines', 'total_price'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'lead_time_days', title: fl('supplier_quotation_lines', 'lead_time_days'), width: 80, align: 'right' as const },
              { dataIndex: 'description', title: fl('supplier_quotation_lines', 'description') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
