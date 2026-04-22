import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const RfqHeaderShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'rfq-headers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${pt('rfq_headers', 'show')} ${record?.rfq_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('rfq_headers', 'rfq_number')}>{record?.rfq_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('rfq_headers', 'due_date')}>
          {record?.due_date ? <DateField value={record.due_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('rfq_headers', 'issued_at')}>
          {record?.issued_at ? <DateField value={record.issued_at} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={fl('rfq_headers', 'issued_by')}>{record?.issued_by}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.rfqLines')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: fl('rfq_lines', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('rfq_lines', 'product_id') },
              { dataIndex: 'qty_requested', title: fl('rfq_lines', 'qty_requested'), width: 100, align: 'right' as const },
              { dataIndex: 'unit_of_measure', title: fl('rfq_lines', 'unit_of_measure'), width: 80 },
              { dataIndex: 'description', title: fl('rfq_lines', 'description') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
