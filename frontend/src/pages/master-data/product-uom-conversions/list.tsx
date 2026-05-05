import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ProductUomConversionList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, edit, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'product-uom-conversions',
    sorters: {
      initial: [{ field: 'created_at', order: 'desc' }],
    },
  });

  return (
    <List
      title={t('menu.productUomConversions')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('product-uom-conversions')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="product_id" title={fl('product_uom_conversions', 'product_id')} ellipsis />
        <Table.Column dataIndex="from_uom_id" title={fl('product_uom_conversions', 'from_uom_id')} ellipsis />
        <Table.Column dataIndex="to_uom_id" title={fl('product_uom_conversions', 'to_uom_id')} ellipsis />
        <Table.Column dataIndex="conversion_factor" title={fl('product_uom_conversions', 'conversion_factor')} width={120} align="right" />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status')}
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={100}
          render={(_, record: any) => (
            <Space>
              <Button size="small" icon={<EyeOutlined />} onClick={() => show('product-uom-conversions', record.id)} />
              <Button size="small" icon={<EditOutlined />} onClick={() => edit('product-uom-conversions', record.id)} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
