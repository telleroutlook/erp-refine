import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const BomHeaderShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'bom-headers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`物料清单 ${record?.bom_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="BOM编号">{record?.bom_number}</Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="基准数量">{record?.quantity}</Descriptions.Item>
        <Descriptions.Item label="版本">{record?.version}</Descriptions.Item>
        <Descriptions.Item label="生效日期">{record?.effective_date ? <DateField value={record.effective_date} format="YYYY-MM-DD" /> : '-'}</Descriptions.Item>
        <Descriptions.Item label="状态"><ActiveStatusTag value={record?.is_active} /></Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>
      {record?.items && record.items.length > 0 && (
        <>
          <Divider>BOM明细</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'sequence', title: '序号', width: 60 },
            { dataIndex: ['product', 'name'], title: '物料' },
            { dataIndex: ['product', 'code'], title: '物料编号', width: 120 },
            { dataIndex: 'quantity', title: '用量', width: 80, align: 'right' as const },
            { dataIndex: 'unit', title: '单位', width: 80 },
            { dataIndex: 'scrap_rate', title: '损耗率(%)', width: 100, align: 'right' as const, render: (v: number) => v ? `${v}%` : '-' },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}
    </Show>
  );
};
