import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { StatusTag } from '../../../components/shared/StatusTag';
import { useTranslation } from 'react-i18next';

export const InventoryReservationShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'inventory-reservations' });
  const { t } = useTranslation();
  const record = queryResult.data?.data as any;

  return (
    <Show title={`库存预留 ${record?.id?.slice(0, 8) ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label="产品">{record?.product?.name}</Descriptions.Item>
        <Descriptions.Item label="产品编号">{record?.product?.code}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="仓库编号">{record?.warehouse?.code}</Descriptions.Item>
        <Descriptions.Item label="预留数量">{record?.reserved_quantity}</Descriptions.Item>
        <Descriptions.Item label="引用类型">{record?.reference_type}</Descriptions.Item>
        <Descriptions.Item label="引用ID">{record?.reference_id}</Descriptions.Item>
        <Descriptions.Item label="到期时间">
          {record?.expires_at ? <DateField value={record.expires_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {record?.created_at ? <DateField value={record.created_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {record?.updated_at ? <DateField value={record.updated_at} format="YYYY-MM-DD HH:mm" /> : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
