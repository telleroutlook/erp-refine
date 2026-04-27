import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';

export const QualityInspectionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'quality-inspections' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('qualityInspection.title')} ${record?.inspection_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('quality_inspections', 'inspection_number')}>{record?.inspection_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('common', 'name')}>{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'inspection_date')}>
          <DateField value={record?.inspection_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'inspector_id')}>{record?.inspector_id}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'reference_type')}>{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'total_quantity')}>{record?.total_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'qualified_quantity')}>{record?.qualified_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'defective_quantity')}>{record?.defective_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'result')}>
          {record?.result ? <StatusTag status={record.result} /> : '-'}
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('qualityInspection.inspectionDetails')}</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'check_item', title: t('qualityInspection.checkItem') },
              { dataIndex: 'check_standard', title: t('qualityInspection.checkStandard') },
              { dataIndex: 'check_result', title: t('qualityInspection.checkResult') },
              { dataIndex: 'measured_value', title: t('qualityInspection.measuredValue'), width: 120 },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
