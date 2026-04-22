import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const WorkOrderShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'work-orders' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`生产工单 ${record?.work_order_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="工单号">{record?.work_order_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="BOM">{record?.bom_header?.bom_number}</Descriptions.Item>
        <Descriptions.Item label="计划数量">{record?.planned_quantity}</Descriptions.Item>
        <Descriptions.Item label="完成数量">{record?.completed_quantity}</Descriptions.Item>
        <Descriptions.Item label="开始日期">{record?.start_date ? <DateField value={record.start_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label="计划完成日期">{record?.planned_completion_date ? <DateField value={record.planned_completion_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label="实际完成日期">{record?.actual_completion_date ? <DateField value={record.actual_completion_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.materials && record.materials.length > 0 && (
        <>
          <Divider>物料需求</Divider>
          <Table dataSource={record.materials} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: ['product', 'name'], title: '物料' },
            { dataIndex: 'required_quantity', title: '需求数量', width: 100, align: 'right' as const },
            { dataIndex: 'issued_quantity', title: '已领数量', width: 100, align: 'right' as const },
            { dataIndex: 'status', title: '状态', width: 100, render: (v: string) => <StatusTag status={v} /> },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}

      {record?.productions && record.productions.length > 0 && (
        <>
          <Divider>生产报工</Divider>
          <Table dataSource={record.productions} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'production_date', title: '报工日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            { dataIndex: 'quantity', title: '生产数量', width: 100, align: 'right' as const },
            { dataIndex: 'qualified_quantity', title: '合格数量', width: 100, align: 'right' as const },
            { dataIndex: 'defective_quantity', title: '不良数量', width: 100, align: 'right' as const },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}
    </Show>
  );
};
