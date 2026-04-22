import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';

export const InventoryCountShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-counts' });
  const { t } = useTranslation();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`库存盘点 ${record?.count_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="盘点单号">{record?.count_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="盘点日期">
          <DateField value={record?.count_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>盘点明细</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'system_quantity', title: '系统数量', width: 100, align: 'right' as const },
              { dataIndex: 'counted_quantity', title: '盘点数量', width: 100, align: 'right' as const },
              { dataIndex: 'variance_quantity', title: '差异数量', width: 100, align: 'right' as const },
              { dataIndex: 'notes', title: '备注' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
