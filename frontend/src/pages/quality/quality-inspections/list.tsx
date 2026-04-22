import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { INSPECTION_STATUS_OPTIONS, INSPECTION_RESULT_OPTIONS, translateOptions } from '../../../constants/options';

export const QualityInspectionList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'quality-inspections',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'inspection_number', label: t('filters.search'), placeholder: 'QI-...' },
    { type: 'status', field: 'status', label: t('filters.status'), options: translateOptions(INSPECTION_STATUS_OPTIONS, t) },
    { type: 'select', field: 'result', label: t('filters.result'), options: translateOptions(INSPECTION_RESULT_OPTIONS, t) },
    { type: 'dateRange', field: 'inspection_date', label: t('filters.dateRange') },
  ];

  return (
    <List
      title="质量检验"
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('quality-inspections')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="inspection_number" title="检验单号" width={160} />
        <Table.Column
          dataIndex="inspection_date"
          title="检验日期"
          width={120}
          render={(v) => <DateField value={v} format="YYYY-MM-DD" />}
        />
        <Table.Column dataIndex={['product', 'name']} title="产品" />
        <Table.Column
          dataIndex="result"
          title="检验结果"
          width={120}
          render={(v) => v ? <StatusTag status={v} /> : '-'}
        />
        <Table.Column dataIndex="total_quantity" title="总数量" width={100} align="right" />
        <Table.Column dataIndex="qualified_quantity" title="合格数" width={100} align="right" />
        <Table.Column dataIndex="defective_quantity" title="不合格数" width={100} align="right" />
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
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('quality-inspections', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('quality-inspections', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
