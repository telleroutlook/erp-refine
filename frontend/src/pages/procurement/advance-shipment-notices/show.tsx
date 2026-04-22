import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';

export const AdvanceShipmentNoticeShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'advance-shipment-notices' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`ASN ${record?.asn_no ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label="ASN编号">{record?.asn_no}</Descriptions.Item>
        <Descriptions.Item label="状态"><StatusTag status={record?.status} /></Descriptions.Item>
        <Descriptions.Item label="供应商">{record?.supplier?.name}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record?.warehouse?.name}</Descriptions.Item>
        <Descriptions.Item label="采购订单号">{record?.purchase_order?.order_number}</Descriptions.Item>
        <Descriptions.Item label="预计到货日">
          <DateField value={record?.expected_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        {record?.remark && <Descriptions.Item label="备注" span={2}>{record.remark}</Descriptions.Item>}
      </Descriptions>

      {record?.items?.length > 0 && (
        <>
          <Divider>ASN行项</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'quantity', title: '数量', width: 100, align: 'right' as const },
              { dataIndex: 'lot_no', title: '批次号', width: 140 },
            ]}
          />
        </>
      )}
    </Show>
  );
};
