import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PriceListShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'price-lists' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.priceLists')} ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('price_lists', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('price_lists', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('price_lists', 'currency')}>{record?.currency}</Descriptions.Item>
        <Descriptions.Item label={fl('price_lists', 'effective_date')}>
          {record?.effective_from ? <DateField value={record.effective_from} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('price_lists', 'expiry_date')}>
          {record?.effective_to ? <DateField value={record.effective_to} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('price_lists', 'is_default')}>
          <Tag color={record?.is_default ? 'green' : 'default'}>{record?.is_default ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.priceDetails')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('price_lists', 'product_id') },
              { dataIndex: 'unit_price', title: fl('price_lists', 'unit_price'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'min_quantity', title: fl('price_lists', 'min_quantity'), width: 100, align: 'right' as const },
              { dataIndex: 'discount_rate', title: fl('price_list_lines', 'discount_rate'), width: 100 },
              { dataIndex: 'effective_from', title: fl('price_lists', 'effective_date'), width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
              { dataIndex: 'effective_to', title: fl('price_lists', 'expiry_date'), width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
