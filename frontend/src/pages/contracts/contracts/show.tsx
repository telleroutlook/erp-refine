import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const ContractShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'contracts' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.contracts')} ${record?.contract_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('contracts', 'contract_number')}>{record?.contract_number}</Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'contract_type')}>{record?.contract_type}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'party_type')}>{record?.party_type}</Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'party_id')}>{record?.party_id}</Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'start_date')}>
          <DateField value={record?.start_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'end_date')}>
          {record?.end_date ? <DateField value={record.end_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'total_amount')}>
          <AmountDisplay value={record?.total_amount} currency={record?.currency} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'tax_rate')}>{record?.tax_rate}</Descriptions.Item>
        <Descriptions.Item label={fl('contracts', 'payment_terms')}>{record?.payment_terms}</Descriptions.Item>
        {record?.description && (
          <Descriptions.Item label={fl('contracts', 'description')} span={2}>{record.description}</Descriptions.Item>
        )}
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('sections.contractLines')}</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('contracts', 'product_id') },
              { dataIndex: 'quantity', title: fl('contracts', 'quantity'), width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('contracts', 'unit_price'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'tax_rate', title: fl('contracts', 'tax_rate'), width: 80 },
              { dataIndex: 'amount', title: fl('contracts', 'amount'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'status', title: fl('contracts', 'status'), width: 100, render: (v: string) => <StatusTag status={v} /> },
              { dataIndex: 'notes', title: fl('contracts', 'notes') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
