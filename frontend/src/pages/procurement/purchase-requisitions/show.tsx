import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PurchaseRequisitionShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'purchase-requisitions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`采购申请 ${record?.requisition_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="申请单号">{record?.requisition_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="部门">{record?.department?.name}</Descriptions.Item>
        <Descriptions.Item label="申请日期">
          <DateField value={record?.request_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="需求日期">
          {record?.required_date ? <DateField value={record.required_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>申请行</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '数量', width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: 'amount', title: '行合计', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: ['suggested_supplier', 'name'], title: '建议供应商', width: 140 },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
