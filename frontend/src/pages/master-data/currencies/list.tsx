import React from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import { useTranslation } from 'react-i18next';

export const CurrencyList: React.FC = () => {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { tableProps } = useTable({
    resource: 'currencies',
    sorters: {
      initial: [{ field: 'currency_code', order: 'asc' }],
    },
  });

  return (
    <List title="币种">
      <Table {...tableProps} rowKey="id" size="small">
        <Table.Column dataIndex="currency_code" title="币种代码" width={100} />
        <Table.Column dataIndex="currency_name" title="币种名称" />
        <Table.Column dataIndex="symbol" title="符号" width={60} />
        <Table.Column dataIndex="decimal_places" title="小数位" width={80} />
        <Table.Column
          dataIndex="is_active"
          title="启用"
          width={80}
          render={(v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>}
        />
        <Table.Column
          title={t('common.actions')}
          width={80}
          render={(_, record: any) => (
            <Button size="small" icon={<EyeOutlined />} onClick={() => show('currencies', record.id)} />
          )}
        />
      </Table>
    </List>
  );
};
