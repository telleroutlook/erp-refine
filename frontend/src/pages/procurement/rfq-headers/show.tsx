import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const RfqHeaderShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'rfq-headers' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`询价单 ${record?.rfq_number ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="询价单号">{record?.rfq_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="截止日期">
          {record?.due_date ? <DateField value={record.due_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="发出时间">
          {record?.issued_at ? <DateField value={record.issued_at} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="发出人">{record?.issued_by}</Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>询价行</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'qty_requested', title: '需求数量', width: 100, align: 'right' as const },
              { dataIndex: 'unit_of_measure', title: '单位', width: 80 },
              { dataIndex: 'description', title: '描述' },
            ]}
          />
        </>
      )}
    </Show>
  );
};
