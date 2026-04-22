import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';

export const WorkOrderProductionShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'work-order-productions' });
  const record = queryResult.data?.data as any;

  return (
    <Show title="生产报工详情" isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="工单号">{record?.work_order?.work_order_number}</Descriptions.Item>
        <Descriptions.Item label="报工日期">{record?.production_date ? <DateField value={record.production_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label="生产数量">{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label="合格数量">{record?.qualified_quantity}</Descriptions.Item>
        <Descriptions.Item label="不良数量">{record?.defective_quantity}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
    </Show>
  );
};
