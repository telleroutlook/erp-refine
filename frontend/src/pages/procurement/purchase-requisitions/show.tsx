import React from 'react';
import { useShow, useNavigation } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PurchaseRequisitionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const { queryResult } = useShow({ resource: 'purchase-requisitions' });
  const record = queryResult.data?.data as any;

  const canCreatePO = record?.status === 'approved';

  const headerButtons = canCreatePO ? (
    <Space>
      <Button
        type="primary"
        icon={<ShoppingCartOutlined />}
        onClick={() => push(`/procurement/purchase-orders/create?createFrom=purchase-requisition&sourceId=${record.id}`)}
      >
        {t('buttons.createPurchaseOrder', 'Create Purchase Order')}
      </Button>
    </Space>
  ) : undefined;

  return (
    <Show
      title={`${pt('purchase_requisitions', 'show')} ${record?.requisition_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <DocumentFlowPanel objectType="purchase_requisition" objectId={record?.id} />
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('purchase_requisitions', 'requisition_number')}>{record?.requisition_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'department_id')}>{record?.department?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'request_date')}>
          <DateField value={record?.request_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'required_date')}>
          {record?.required_date ? <DateField value={record.required_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.requisitionLines')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: fl('purchase_requisition_lines', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('purchase_requisition_lines', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('purchase_requisition_lines', 'quantity'), width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('purchase_requisition_lines', 'unit_price'), width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: 'amount', title: fl('purchase_requisition_lines', 'amount'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: ['suggested_supplier', 'name'], title: fl('purchase_requisition_lines', 'suggested_supplier_id'), width: 140 },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}
    </Show>
  );
};
