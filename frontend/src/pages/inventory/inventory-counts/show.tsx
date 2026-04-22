import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const InventoryCountShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-counts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('inventory_counts', 'show', { name: record?.count_number ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('inventory_counts', 'count_number')}>{record?.count_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('inventory_counts', 'count_date')}>
          <DateField value={record?.count_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.countDetails')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: fl('inventory_count_lines', 'product_id') },
              { dataIndex: 'system_quantity', title: fl('inventory_count_lines', 'system_quantity'), width: 100, align: 'right' as const },
              { dataIndex: 'counted_quantity', title: fl('inventory_count_lines', 'counted_quantity'), width: 100, align: 'right' as const },
              { dataIndex: 'variance_quantity', title: fl('inventory_count_lines', 'variance_quantity'), width: 100, align: 'right' as const },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
