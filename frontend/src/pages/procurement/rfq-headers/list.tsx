import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { RFQ_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useFieldLabel } from '../../../hooks';

export const RfqHeaderList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'rfq-headers',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'rfq_number', label: t('filters.search'), placeholder: 'RFQ-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(RFQ_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List
      title={t('menu.rfqHeaders')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('rfq-headers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="rfq_number" title={fl('rfq_headers', 'rfq_number')} width={160} />
        <Table.Column
          dataIndex="due_date"
          title={fl('rfq_headers', 'due_date')}
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="issued_at"
          title={fl('rfq_headers', 'issued_at')}
          width={120}
          render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'}
        />
        <Table.Column
          dataIndex="status"
          title={t('common.status')}
          width={120}
          render={(status) => <StatusTag status={status} />}
        />
        <Table.Column
          title={t('common.actions')}
          width={120}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('rfq-headers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('rfq-headers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
