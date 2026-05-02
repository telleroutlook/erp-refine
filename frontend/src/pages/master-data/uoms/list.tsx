import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';

export const UomList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show } = useNavigation();

  const { tableProps, setFilters } = useTable({
    resource: 'uoms',
    sorters: {
      initial: [{ field: 'uom_code', order: 'asc' }],
    },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'uom_name', label: t('filters.name') },
    { type: 'search', field: 'uom_code', label: t('filters.code') },
  ];

  return (
    <List title={t('menu.uoms')}>
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="uom_code" title={t('menu.uoms')} width={100} />
        <Table.Column dataIndex="uom_name" title={t('menu.uoms')} />
        <Table.Column dataIndex="uom_type" title={t('menu.uoms')} render={(v) => v ? t(`enums.uomCategory.${v}`, v) : '-'} />
        <Table.Column dataIndex="conversion_factor" title={t('menu.uoms')} width={100} />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('uoms', record.id)} />
          )}
        />
      </Table>
    </List>
  );
};
