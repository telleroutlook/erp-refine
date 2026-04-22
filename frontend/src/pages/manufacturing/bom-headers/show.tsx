import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const BomHeaderShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'bom-headers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('bom_headers', 'show', { name: record?.bom_number ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('bom_headers', 'bom_number')}>{record?.bom_number}</Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('bom_headers', 'quantity')}>{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('bom_headers', 'version')}>{record?.version}</Descriptions.Item>
        <Descriptions.Item label={fl('bom_headers', 'effective_date')}>{record?.effective_date ? <DateField value={record.effective_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><ActiveStatusTag value={record?.is_active} /></Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('sections.bomItems')}</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'sequence', title: fl('bom_items', 'sequence'), width: 60 },
            { dataIndex: ['product', 'name'], title: fl('bom_items', 'product_id') },
            { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
            { dataIndex: 'quantity', title: fl('bom_items', 'quantity'), width: 80, align: 'right' as const },
            { dataIndex: 'unit', title: fl('bom_items', 'unit'), width: 80 },
            { dataIndex: 'scrap_rate', title: fl('bom_items', 'scrap_rate'), width: 100, align: 'right' as const, render: (v: number) => v ? `${v}%` : '-' },
            { dataIndex: 'notes', title: t('common.notes') },
          ]} />
        </>
      )}
    </Show>
  );
};
