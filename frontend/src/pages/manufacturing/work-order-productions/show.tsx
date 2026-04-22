import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WorkOrderProductionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'work-order-productions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('work_order_productions', 'show')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('work_orders', 'work_order_number')}>{record?.work_order?.work_order_number}</Descriptions.Item>
        <Descriptions.Item label={fl('work_order_productions', 'production_date')}>{record?.production_date ? <DateField value={record.production_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('work_order_productions', 'quantity')}>{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('work_order_productions', 'qualified_quantity')}>{record?.qualified_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('work_order_productions', 'defective_quantity')}>{record?.defective_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('common', 'created_at')}>{record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
