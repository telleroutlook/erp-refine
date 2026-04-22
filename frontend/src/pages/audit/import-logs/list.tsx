import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { IMPORT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';

export const ImportLogList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'import-logs',
    sorters: { initial: [{ field: 'started_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'status', field: 'status', label: t('common.status'), options: translateOptions(IMPORT_STATUS_OPTIONS, t) },
    { type: 'dateRange', field: 'created_at', label: t('filters.dateRange') },
  ];

  return (
    <List title={t('menu.importLogs')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="resource_type" title="资源类型" width={140} />
        <Table.Column dataIndex="file_name" title="文件名" />
        <Table.Column dataIndex="status" title={t('common.status')} width={100} render={(s) => <StatusTag status={s} />} />
        <Table.Column dataIndex="total_rows" title="总行数" width={80} align="right" />
        <Table.Column dataIndex="success_count" title="成功" width={80} align="right" />
        <Table.Column dataIndex="error_count" title="失败" width={80} align="right" />
        <Table.Column dataIndex="started_at" title="开始时间" width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('import-logs', r.id)} />} />
      </Table>
    </List>
  );
};
