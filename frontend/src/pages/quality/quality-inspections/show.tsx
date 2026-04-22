import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const QualityInspectionShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'quality-inspections' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`质量检验 ${record?.inspection_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="检验单号">{record?.inspection_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="检验日期">
          <DateField value={record?.inspection_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label="检验员">{record?.inspector_id}</Descriptions.Item>
        <Descriptions.Item label="来源类型">{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label="总数量">{record?.total_quantity}</Descriptions.Item>
        <Descriptions.Item label="合格数量">{record?.qualified_quantity}</Descriptions.Item>
        <Descriptions.Item label="不合格数量">{record?.defective_quantity}</Descriptions.Item>
        <Descriptions.Item label="检验结果">
          {record?.result ? <StatusTag status={record.result} /> : '-'}
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>检验明细</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'check_item', title: '检验项目' },
              { dataIndex: 'check_standard', title: '检验标准' },
              { dataIndex: 'check_result', title: '检验结果' },
              { dataIndex: 'measured_value', title: '测量值', width: 120 },
              { dataIndex: 'notes', title: '备注' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
