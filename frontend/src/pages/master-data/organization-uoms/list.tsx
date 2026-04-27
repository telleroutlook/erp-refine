import React from 'react';
import { useTable, List, DateField } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const OrganizationUomList: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { show, create } = useNavigation();

  const { tableProps } = useTable({
    resource: 'organization-uoms',
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
  });

  return (
    <List
      title={t('menu.organizationUoms')}
      headerButtons={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => create('organization-uoms')}>
          {t('buttons.create')}
        </Button>
      }
    >
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="uom_id" title={fl('organization_uoms', 'uom_id')} width={160} />
        <Table.Column dataIndex="is_default" title={fl('organization_uoms', 'is_default')} width={100} render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>} />
        <Table.Column dataIndex="created_at" title={fl('organization_uoms', 'created_at')} width={160} render={(v) => <DateField value={v} format="YYYY-MM-DD HH:mm" />} />
        <Table.Column title={t('common.actions')} width={60} render={(_, r: any) => <Button size="small" icon={<EyeOutlined />} onClick={() => show('organization-uoms', r.id)} />} />
      </Table>
    </List>
  );
};
