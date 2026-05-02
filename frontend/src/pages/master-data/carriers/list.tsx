import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const CarrierList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'carriers',
    sorters: { initial: [{ field: 'code', order: 'asc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'name', label: t('filters.name') },
  ];

  const carrierTypeLabels: Record<string, string> = {
    express: t('enums.carrierType.express'),
    freight: t('enums.carrierType.freight'),
    ltl: t('enums.carrierType.ltl'),
    ftl: t('enums.carrierType.ftl'),
    ocean: t('enums.carrierType.ocean'),
    air: t('enums.carrierType.air'),
  };

  return (
    <List
      title={t('menu.carriers')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('carriers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="code" title={t('menu.carriers')} width={120} />
        <Table.Column dataIndex="name" title={t('menu.carriers')} />
        <Table.Column
          dataIndex="carrier_type"
          title={t('menu.carriers')}
          width={100}
          render={(v) => carrierTypeLabels[v] ?? v}
        />
        <Table.Column dataIndex="contact" title={t('menu.carriers')} width={120} />
        <Table.Column dataIndex="phone" title={t('menu.carriers')} width={140} />
        <Table.Column
          dataIndex="is_active"
          title={t('menu.carriers')}
          width={80}
          render={(v) => <ActiveStatusTag value={v} />}
        />
        <Table.Column
          title={t('menu.carriers')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('carriers', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('carriers', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
