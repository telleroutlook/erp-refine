import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Space } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { ListFilters, type FilterFieldConfig } from '../../../components/shared/ListFilters';
import { useFieldLabel } from '../../../hooks';

export const BomHeaderList: React.FC = () => {
  const { t } = useTranslation();
  const { show, edit, create } = useNavigation();
  const fl = useFieldLabel();
  const { tableProps, setFilters } = useTable({
    resource: 'bom-headers',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  const filterConfig: FilterFieldConfig[] = [
    { type: 'search', field: 'bom_number', label: t('filters.search'), placeholder: 'BOM-...' },
    { type: 'entity', field: 'product_id', label: t('filters.product'), resource: 'products' },
    { type: 'itemProduct', field: '_item_product_id', label: t('filters.itemProduct') },
  ];

  return (
    <List
      title={t('menu.bomHeaders')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('bom-headers')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <ListFilters config={filterConfig} setFilters={setFilters} />
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="bom_number" title={fl('bom_headers', 'bom_number')} width={160} />
        <Table.Column dataIndex={['product', 'name']} title={fl('products', 'name')} />
        <Table.Column dataIndex="quantity" title={fl('bom_headers', 'quantity')} width={100} align="right" />
        <Table.Column dataIndex="version" title={fl('bom_headers', 'version')} width={80} />
        <Table.Column dataIndex="effective_date" title={fl('bom_headers', 'effective_date')} width={120} render={(v) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-'} />
        <Table.Column dataIndex="is_active" title={t('common.status')} width={80} render={(v) => <ActiveStatusTag value={v} />} />
        <Table.Column title={t('common.actions')} width={120} render={(_, record: any) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('bom-headers', record.id)} />
            <Button size="small" icon={<EditOutlined />} onClick={() => edit('bom-headers', record.id)} />
          </Space>
        )} />
      </Table>
    </List>
  );
};
