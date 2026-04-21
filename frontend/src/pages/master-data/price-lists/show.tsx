import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PriceListShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'price-lists' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`价格表 ${record?.name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="编号">{record?.code}</Descriptions.Item>
        <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
        <Descriptions.Item label="货币">{record?.currency}</Descriptions.Item>
        <Descriptions.Item label="生效日期">
          {record?.effective_from ? <DateField value={record.effective_from} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="到期日期">
          {record?.effective_to ? <DateField value={record.effective_to} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="默认">
          <Tag color={record?.is_default ? 'green' : 'default'}>{record?.is_default ? '是' : '否'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>价格明细</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'min_quantity', title: '最小数量', width: 100, align: 'right' as const },
              { dataIndex: 'discount_rate', title: '折扣率', width: 100 },
              { dataIndex: 'effective_from', title: '生效日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
              { dataIndex: 'effective_to', title: '到期日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
