import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WorkOrderShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'work-orders' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('work_orders', 'show', { name: record?.work_order_number ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('work_orders', 'work_order_number')}>{record?.work_order_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label={fl('products', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'bom_header_id')}>{record?.bom_header?.bom_number}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'planned_quantity')}>{record?.planned_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'completed_quantity')}>{record?.completed_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'start_date')}>{record?.start_date ? <DateField value={record.start_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'planned_completion_date')}>{record?.planned_completion_date ? <DateField value={record.planned_completion_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('work_orders', 'actual_completion_date')}>{record?.actual_completion_date ? <DateField value={record.actual_completion_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('warehouses', 'name')}>{record?.warehouse?.name}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.materials && record.materials.length > 0 && (
        <>
          <Divider>{t('sections.materialRequirements')}</Divider>
          <Table dataSource={record.materials} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: ['product', 'name'], title: fl('work_order_materials', 'product_id') },
            { dataIndex: 'required_quantity', title: fl('work_order_materials', 'required_quantity'), width: 100, align: 'right' as const },
            { dataIndex: 'issued_quantity', title: fl('work_order_materials', 'issued_quantity'), width: 100, align: 'right' as const },
            { dataIndex: 'status', title: t('common.status'), width: 100, render: (v: string) => <StatusTag status={v} /> },
            { dataIndex: 'notes', title: t('common.notes') },
          ]} />
        </>
      )}

      {record?.productions && record.productions.length > 0 && (
        <>
          <Divider>{t('sections.productionReports')}</Divider>
          <Table dataSource={record.productions} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'production_date', title: fl('work_order_productions', 'production_date'), width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            { dataIndex: 'quantity', title: fl('work_order_productions', 'quantity'), width: 100, align: 'right' as const },
            { dataIndex: 'qualified_quantity', title: fl('work_order_productions', 'qualified_quantity'), width: 100, align: 'right' as const },
            { dataIndex: 'defective_quantity', title: fl('work_order_productions', 'defective_quantity'), width: 100, align: 'right' as const },
            { dataIndex: 'notes', title: t('common.notes') },
          ]} />
        </>
      )}
    </Show>
  );
};
